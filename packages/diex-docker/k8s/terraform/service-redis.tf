resource "kubernetes_service" "diexcrm_redis" {
  metadata {
    name      = "${var.diexcrm_app_name}-redis"
    namespace = kubernetes_namespace.diexcrm.metadata.0.name
  }
  spec {
    selector = {
      app = "${var.diexcrm_app_name}-redis"
    }
    session_affinity = "ClientIP"
    port {
      port        = 6379
      target_port = 6379
    }

    type = "ClusterIP"
  }
}
