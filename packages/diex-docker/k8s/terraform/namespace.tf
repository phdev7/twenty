resource "kubernetes_namespace" "diexcrm" {
  metadata {
    annotations = {
      name = var.diexcrm_namespace
    }

    name = var.diexcrm_namespace
  }
}
