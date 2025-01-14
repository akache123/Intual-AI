# /lib README

This directory contains utility functions and configurations for the application. Below is a brief explanation of the functions and configurations in the `lib` directory.


- **utils.ts**
  - **Libraries**: `clsx`, `tailwind-merge`, `aws-sdk`.
  - **Purpose**: Provides utility functions for class name merging and AWS S3 operations.
  - **Usage**: 
    - `cn(...inputs: ClassValue[])`: Merges class names using `clsx` and `tailwind-merge`.
    - `uploadUserInfo(userId: string, firstName: string, lastName: string)`: Uploads user information to an S3 bucket.
    - `createNewProject(projectId: string)`: Creates a new project JSON file in an S3 bucket.
    - `deleteProject(projectId: string)`: Deletes a project JSON file from an S3 bucket.
