import { generateUploadButton, generateUploadDropzone } from "@uploadthing/react";
import type { FileRouter } from "uploadthing/next";

// Define the FileRouter type locally — mirrors backend/src/uploadthing.ts
export type OurFileRouter = FileRouter & {
  taskAttachment: {
    input: {};
    output: { ufsUrl: string; name: string; size: number };
  };
};

// Same-origin proxy by default (see next.config.ts rewrites).
const UPLOAD_URL = `${process.env.NEXT_PUBLIC_API_URL || '/api'}/uploadthing`;

export const UploadButton = generateUploadButton<OurFileRouter>({
  url: UPLOAD_URL,
});

export const UploadDropzone = generateUploadDropzone<OurFileRouter>({
  url: UPLOAD_URL,
});