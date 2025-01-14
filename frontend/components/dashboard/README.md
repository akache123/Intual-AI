# /components/dashboard README

This directory contains components related to the dashboard.

- **new-project-modal**
  - Contains components specific to the "New Project" modal functionality.
  
  - **CreateNewProjectModal.tsx**
    - **Libraries**: `react`, `@radix-ui/react-dialog`, custom `dialog`, `input`, and `button` components.
    - **Purpose**: Main component for creating a new project modal.
    - **Usage**: Displayed when users want to create a new project, guiding them through the steps.

  - **SelectProject.tsx**
    - **Libraries**: `react`, custom `select` components.
    - **Purpose**: Provides a dropdown interface for selecting or creating a new project.
    - **Usage**: Used in the dashboard to allow users to select an existing project or create a new one via the `CreateNewProjectModal`.
