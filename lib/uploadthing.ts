
import type { OurFileRouter } from "../../backend/src/uploadthing";
import {
  generateUploadButton,
  generateUploadDropzone,
} from "@uploadthing/react";

export const UploadButton = generateUploadButton<OurFileRouter>({
  // CRITICAL: Point to your Express backend, not Next.js
  url: "http://localhost:5000/api/uploadthing",
});
export const UploadDropzone = generateUploadDropzone<OurFileRouter>({
  url: "http://localhost:5000/api/uploadthing",
});
