import { generateUploadButton, generateUploadDropzone } from "@uploadthing/react";
import type { FileRouter } from "uploadthing/next";

// Define the FileRouter type locally — mirrors backend/src/uploadthing.ts
export type OurFileRouter = FileRouter & {
  taskAttachment: {
    input: {};
    output: { ufsUrl: string; name: string; size: number };
  };
};

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

export const UploadButton = generateUploadButton<OurFileRouter>({
  url: `${API_URL}/api/uploadthing`,
});

export const UploadDropzone = generateUploadDropzone<OurFileRouter>({
  url: `${API_URL}/api/uploadthing`,
});