#!/usr/bin/env bash

set -euo pipefail
umask 077

if [[ -z "${SOURCE_DATABASE_URL:-}" ]]; then
  echo "SOURCE_DATABASE_URL is required." >&2
  exit 1
fi

if [[ -z "${SOURCE_TEAM_ID:-}" ]]; then
  echo "SOURCE_TEAM_ID is required." >&2
  exit 1
fi

if [[ ! "${SOURCE_TEAM_ID}" =~ ^[0-9A-HJKMNP-TV-Z]{26}$ ]]; then
  echo "SOURCE_TEAM_ID must be a valid ULID." >&2
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "psql is required." >&2
  exit 1
fi

script_directory="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
default_directory="${PWD}/diex-export-$(date -u +%Y%m%dT%H%M%SZ)"
export_directory="${1:-${default_directory}}"

mkdir -p "${export_directory}"
export_directory="$(cd "${export_directory}" && pwd)"

if [[ "${export_directory}" == *"'"* ]] || [[ "${export_directory}" == *$'\n'* ]]; then
  echo "The export directory cannot contain quotes or newlines." >&2
  exit 1
fi

exported_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

psql "${SOURCE_DATABASE_URL}" \
  -X \
  -v ON_ERROR_STOP=1 \
  -v source_team_id="${SOURCE_TEAM_ID}" \
  -q <<SQL
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
\pset format unaligned
\pset tuples_only on
\pset pager off

\o '${export_directory}/companies.jsonl'
  SELECT jsonb_build_object(
    'legacyId', c.id,
    'name', c.name,
    'primaryDomain', c.primary_domain,
    'segment', c.segment,
    'niche', c.niche,
    'annualRevenueRange', c.annual_revenue_range,
    'employeeRange', c.employee_range,
    'website', c.website,
    'city', c.city,
    'state', c.state,
    'identityScore', c.identity_score,
    'healthScore', c.health_score,
    'churnRiskScore', c.churn_risk_score,
    'expansionScore', c.expansion_score,
    'healthStatus', c.health_status,
    'healthReasons', CASE WHEN c.health_reasons IS NULL THEN NULL ELSE c.health_reasons::text END,
    'nextReviewAt', c.next_review_at,
    'hasSuccessPlan', EXISTS (
      SELECT 1
      FROM cs_relationships csr
      WHERE csr.team_id = c.team_id
        AND csr.company_id = c.id
    ),
    'createdAt', c.created_at,
    'updatedAt', c.updated_at
  )
  FROM companies c
  WHERE c.team_id = :'source_team_id'
    AND c.deleted_at IS NULL
  ORDER BY c.id;
\o

\o '${export_directory}/people.jsonl'
  SELECT jsonb_build_object(
    'legacyId', p.id,
    'companyLegacyId', p.company_id,
    'name', p.name,
    'primaryEmail', COALESCE(p.primary_email, cp_email.value),
    'primaryPhone', COALESCE(p.primary_phone, cp_phone.value),
    'jobTitle', p.job_title,
    'linkedinUrl', p.linkedin_url,
    'identityScore', p.identity_score,
    'consentStatus', COALESCE(p.consent_status, cp_phone.marketing_status, cp_email.marketing_status),
    'marketingStatus', COALESCE(cp_phone.marketing_status, cp_email.marketing_status),
    'consentedAt', COALESCE(cp_phone.consented_at, cp_email.consented_at),
    'createdAt', p.created_at,
    'updatedAt', p.updated_at
  )
  FROM people p
  LEFT JOIN LATERAL (
    SELECT cp.value, cp.marketing_status, cp.consented_at
    FROM contact_points cp
    WHERE cp.team_id = p.team_id
      AND cp.people_id = p.id
      AND cp.type = 'email'
      AND cp.deleted_at IS NULL
    ORDER BY cp.is_primary DESC, cp.created_at ASC
    LIMIT 1
  ) cp_email ON true
  LEFT JOIN LATERAL (
    SELECT cp.value, cp.marketing_status, cp.consented_at
    FROM contact_points cp
    WHERE cp.team_id = p.team_id
      AND cp.people_id = p.id
      AND cp.type IN ('phone', 'whatsapp')
      AND cp.deleted_at IS NULL
    ORDER BY cp.is_primary DESC, cp.created_at ASC
    LIMIT 1
  ) cp_phone ON true
  WHERE p.team_id = :'source_team_id'
    AND p.deleted_at IS NULL
    AND p.merged_into_id IS NULL
  ORDER BY p.id;
\o

\o '${export_directory}/offers.jsonl'
  SELECT row_data
  FROM (
    SELECT
      p.id AS sort_id,
      jsonb_build_object(
        'legacyId', 'product:' || p.id,
        'name', p.name,
        'category', p.category,
        'description', p.short_description,
        'commercialDescription', p.commercial_description,
        'problemSolved', p.problem_solved,
        'idealCustomerProfile', p.ideal_customer_profile,
        'priceRange', p.price_range,
        'commonObjections', p.common_objections,
        'qualificationQuestions', CASE WHEN p.qualification_questions IS NULL THEN NULL ELSE p.qualification_questions::text END,
        'recommendedCta', p.recommended_cta,
        'active', p.active,
        'createdAt', p.created_at,
        'updatedAt', p.updated_at
      ) AS row_data
    FROM products p
    WHERE p.team_id = :'source_team_id'
      AND p.deleted_at IS NULL

    UNION ALL

    SELECT
      o.id AS sort_id,
      jsonb_build_object(
        'legacyId', 'offer:' || o.id,
        'productLegacyId', CASE WHEN o.product_id IS NULL THEN NULL ELSE 'product:' || o.product_id END,
        'name', o.name,
        'category', p.category,
        'headline', o.headline,
        'description', o.description,
        'priceRange', o.price_range,
        'includedItems', o.included_items,
        'proofNotes', o.proof_notes,
        'objectionHandling', o.objection_handling,
        'recommendedCta', o.recommended_cta,
        'active', o.active,
        'createdAt', o.created_at,
        'updatedAt', o.updated_at
      ) AS row_data
    FROM offers o
    LEFT JOIN products p
      ON p.team_id = o.team_id
      AND p.id = o.product_id
    WHERE o.team_id = :'source_team_id'
      AND o.deleted_at IS NULL
  ) normalized_offers
  ORDER BY sort_id;
\o

\o '${export_directory}/opportunities.jsonl'
  SELECT jsonb_build_object(
    'legacyId', o.id,
    'companyLegacyId', o.company_id,
    'personLegacyId', o.contact_id,
    'name', o.name,
    'stageName', opportunity_stage.name,
    'amount', opportunity_amount.amount,
    'currency', opportunity_amount.currency,
    'sourceChannel', o.source_channel,
    'leadOrigin', o.lead_origin,
    'prospectingStatus', o.prospecting_status,
    'nextContactAt', o.next_contact_at,
    'priority', o.priority,
    'nextAction', o.next_action,
    'nextBestAction', o.next_best_action,
    'lossReason', o.loss_reason,
    'lastIntent', o.last_intent,
    'riskLevel', o.risk_level,
    'leadScore', o.lead_score,
    'leadScoreReasons', CASE WHEN o.lead_score_reasons IS NULL THEN NULL ELSE o.lead_score_reasons::text END,
    'leadScoreUpdatedAt', o.lead_score_updated_at,
    'createdAt', o.created_at,
    'updatedAt', o.updated_at
  )
  FROM opportunities o
  LEFT JOIN LATERAL (
    SELECT cfo.name
    FROM custom_fields cf
    INNER JOIN custom_field_values cfv
      ON cfv.tenant_id = cf.tenant_id
      AND cfv.custom_field_id = cf.id
      AND cfv.entity_id = o.id
    INNER JOIN custom_field_options cfo
      ON cfo.tenant_id = cf.tenant_id
      AND cfo.custom_field_id = cf.id
      AND cfo.id::text = cfv.string_value
      AND cfo.deleted_at IS NULL
    WHERE cf.tenant_id = o.team_id
      AND cf.entity_type = 'opportunity'
      AND cf.code IN ('stage', 'pipeline_stage', 'status')
      AND cf.deleted_at IS NULL
    ORDER BY
      CASE cf.code
        WHEN 'stage' THEN 0
        WHEN 'pipeline_stage' THEN 1
        ELSE 2
      END
    LIMIT 1
  ) opportunity_stage ON true
  LEFT JOIN LATERAL (
    SELECT
      cfv.float_value AS amount,
      COALESCE(
        cf.settings->'additional'->>'currency_code',
        'BRL'
      ) AS currency
    FROM custom_fields cf
    INNER JOIN custom_field_values cfv
      ON cfv.tenant_id = cf.tenant_id
      AND cfv.custom_field_id = cf.id
      AND cfv.entity_id = o.id
    WHERE cf.tenant_id = o.team_id
      AND cf.entity_type = 'opportunity'
      AND cf.code = 'amount'
      AND cf.deleted_at IS NULL
    LIMIT 1
  ) opportunity_amount ON true
  WHERE o.team_id = :'source_team_id'
    AND o.deleted_at IS NULL
  ORDER BY o.id;
\o

\o '${export_directory}/tasks.jsonl'
  SELECT jsonb_build_object(
    'legacyId', t.id,
    'title', t.title,
    'aiGenerated', t.ai_generated,
    'originType', t.origin_type,
    'dueReason', t.due_reason,
    'targets', COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'type', tt.taskable_type,
            'legacyId', tt.taskable_id
          )
          ORDER BY tt.id
        )
        FROM taskables tt
        WHERE tt.task_id = t.id
      ),
      '[]'::jsonb
    ),
    'createdAt', t.created_at,
    'updatedAt', t.updated_at
  )
  FROM tasks t
  WHERE t.team_id = :'source_team_id'
    AND t.deleted_at IS NULL
  ORDER BY t.id;
\o

\o '${export_directory}/notes.jsonl'
  SELECT jsonb_build_object(
    'legacyId', n.id,
    'title', n.title,
    'body', NULL,
    'targets', COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'type', nn.noteable_type,
            'legacyId', nn.noteable_id
          )
          ORDER BY nn.id
        )
        FROM noteables nn
        WHERE nn.note_id = n.id
      ),
      '[]'::jsonb
    ),
    'createdAt', n.created_at,
    'updatedAt', n.updated_at
  )
  FROM notes n
  WHERE n.team_id = :'source_team_id'
    AND n.deleted_at IS NULL
  ORDER BY n.id;
\o

\o '${export_directory}/success-plans.jsonl'
  SELECT jsonb_build_object(
    'legacyId', csr.id,
    'companyLegacyId', csr.company_id,
    'companyName', c.name,
    'primaryPersonLegacyId', primary_stakeholder.people_id,
    'name', 'Plano de sucesso - ' || c.name,
    'lifecycleState', csr.lifecycle_state,
    'healthStatus', c.health_status,
    'healthScore', c.health_score,
    'healthReasons', CASE WHEN c.health_reasons IS NULL THEN NULL ELSE c.health_reasons::text END,
    'startedAt', csr.started_at,
    'nextReviewAt', COALESCE(csr.next_review_at, c.next_review_at),
    'closureReason', csr.closure_reason,
    'createdAt', csr.created_at,
    'updatedAt', csr.updated_at
  )
  FROM cs_relationships csr
  INNER JOIN companies c
    ON c.team_id = csr.team_id
    AND c.id = csr.company_id
  LEFT JOIN LATERAL (
    SELECT css.people_id
    FROM cs_stakeholders css
    WHERE css.team_id = csr.team_id
      AND css.relationship_id = csr.id
      AND css.active = true
    ORDER BY css.primary DESC, css.created_at ASC
    LIMIT 1
  ) primary_stakeholder ON true
  WHERE csr.team_id = :'source_team_id'
  ORDER BY csr.id;
\o

\o '${export_directory}/success-milestones.jsonl'
  SELECT jsonb_build_object(
    'legacyId', cso.id,
    'successPlanLegacyId', cso.relationship_id,
    'name', cso.title,
    'description', cso.description,
    'objectiveType', cso.objective_type,
    'priority', cso.priority,
    'status', cso.status,
    'targetAt', cso.target_at,
    'causalConfidence', cso.causal_confidence,
    'causalJustification', cso.causal_justification,
    'lastReviewedAt', cso.last_reviewed_at,
    'nextReviewAt', cso.next_review_at,
    'createdAt', cso.created_at,
    'updatedAt', cso.updated_at
  )
  FROM cs_objectives cso
  WHERE cso.team_id = :'source_team_id'
  ORDER BY cso.id;
\o

\o '${export_directory}/commercial-signals.jsonl'
  SELECT jsonb_build_object(
    'legacyId', s.id,
    'companyLegacyId', s.company_id,
    'type', s.type,
    'direction', s.direction,
    'weight', s.weight,
    'title', s.title,
    'description', s.description,
    'source', s.source,
    'sourceReference', s.source_reference,
    'occurredAt', s.occurred_at,
    'expiresAt', s.expires_at,
    'createdAt', s.created_at,
    'updatedAt', s.updated_at
  )
  FROM account_signals s
  WHERE s.team_id = :'source_team_id'
    AND s.deleted_at IS NULL
  ORDER BY s.id;
\o

\o '${export_directory}/inbox-conversations.jsonl'
  SELECT jsonb_build_object(
    'legacyId', cc.id,
    'personLegacyId', cc.people_id,
    'companyLegacyId', p.company_id,
    'personName', p.name,
    'externalId', cc.external_id,
    'status', cc.status,
    'priority', cc.priority,
    'unreadCount', cc.unread_count,
    'lastMessageAt', cc.last_message_at,
    'firstResponseDueAt', cc.first_response_due_at,
    'firstRespondedAt', cc.first_responded_at,
    'followUpDueAt', cc.followup_due_at,
    'slaBreachedAt', cc.sla_breached_at,
    'channelType', channel.type,
    'channelName', channel.name,
    'channelPhone', channel.phone_number,
    'contactHandle', COALESCE(cp.value, channel.phone_number),
    'createdAt', cc.created_at,
    'updatedAt', cc.updated_at
  )
  FROM customer_conversations cc
  INNER JOIN communication_channels channel
    ON channel.team_id = cc.team_id
    AND channel.id = cc.communication_channel_id
    AND channel.deleted_at IS NULL
  LEFT JOIN people p
    ON p.team_id = cc.team_id
    AND p.id = cc.people_id
  LEFT JOIN LATERAL (
    SELECT contact.value
    FROM contact_points contact
    WHERE contact.team_id = cc.team_id
      AND contact.people_id = cc.people_id
      AND contact.deleted_at IS NULL
      AND (
        (channel.type = 'email' AND contact.type = 'email')
        OR
        (channel.type <> 'email' AND contact.type IN ('phone', 'whatsapp'))
      )
    ORDER BY contact.is_primary DESC, contact.created_at ASC
    LIMIT 1
  ) cp ON true
  WHERE cc.team_id = :'source_team_id'
    AND cc.deleted_at IS NULL
  ORDER BY cc.id;
\o

\o '${export_directory}/inbox-messages.jsonl'
  SELECT jsonb_build_object(
    'legacyId', cm.id,
    'conversationLegacyId', cm.customer_conversation_id,
    'externalId', cm.external_id,
    'direction', cm.direction,
    'type', cm.type,
    'content', cm.content,
    'status', cm.status,
    'sentAt', cm.sent_at,
    'createdAt', cm.created_at,
    'updatedAt', cm.updated_at
  )
  FROM customer_messages cm
  WHERE cm.team_id = :'source_team_id'
    AND EXISTS (
      SELECT 1
      FROM customer_conversations cc
      INNER JOIN communication_channels channel
        ON channel.team_id = cc.team_id
        AND channel.id = cc.communication_channel_id
        AND channel.deleted_at IS NULL
      WHERE cc.team_id = cm.team_id
        AND cc.id = cm.customer_conversation_id
        AND cc.deleted_at IS NULL
    )
  ORDER BY cm.id;
\o

\o '${export_directory}/ai-actions.jsonl'
  SELECT jsonb_build_object(
    'legacyId', ai.id,
    'conversationLegacyId', ai.customer_conversation_id,
    'personLegacyId', ai.people_id,
    'opportunityLegacyId', ai.opportunity_id,
    'name', 'Sugestão ' || ai.type,
    'type', ai.type,
    'channel', ai.channel,
    'status', ai.status,
    'content', ai.content,
    'rationale', ai.rationale,
    'confidence', ai.confidence,
    'reviewedAt', ai.reviewed_at,
    'createdAt', ai.created_at,
    'updatedAt', ai.updated_at
  )
  FROM ai_suggestion_queue ai
  WHERE ai.team_id = :'source_team_id'
  ORDER BY ai.id;
\o

COMMIT;
SQL

node "${script_directory}/build-manifest.mjs" \
  "${export_directory}" \
  "${SOURCE_TEAM_ID}" \
  "${exported_at}"

echo "Sanitized export created at ${export_directory}"
