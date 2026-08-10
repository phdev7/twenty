import { type ApplicationManifest } from 'diex-shared/application';

export const toGalleryImagePaths = (
  application: ApplicationManifest | undefined,
): string[] => {
  const galleryImages = application?.galleryImages;

  if (galleryImages && galleryImages.length > 0) {
    return galleryImages;
  }

  return application?.screenshots ?? [];
};
