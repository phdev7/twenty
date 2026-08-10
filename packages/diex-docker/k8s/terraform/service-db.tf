resource "kubernetes_service" "diexcrm_db" {
  metadata {
    name      = "${var.diexcrm_app_name}-db"
    namespace = kubernetes_namespace.diexcrm.metadata.0.name
  }
  spec {
    selector = {
      app = "${var.diexcrm_app_name}-db"
    }
    session_affinity = "ClientIP"
    port {
      port        = 5432
      target_port = 5432
    }

    type = "ClusterIP"
  }
}
