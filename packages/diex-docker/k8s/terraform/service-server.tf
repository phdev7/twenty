resource "kubernetes_service" "diexcrm_server" {
  metadata {
    name      = "${var.diexcrm_app_name}-server"
    namespace = kubernetes_namespace.diexcrm.metadata.0.name
  }
  spec {
    selector = {
      app = "${var.diexcrm_app_name}-server"
    }
    session_affinity = "ClientIP"
    port {
      name        = "http-tcp"
      port        = 3000
      target_port = 3000
    }

    type = "ClusterIP"
  }
}
