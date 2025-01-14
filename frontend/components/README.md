# /components README

This project uses a variety of components to build the UI. Below is a brief explanation of the components in the `components` directory and its subdirectories.

## /components Directory

- **dashboard**
  - Contains components for the dashboard.

- **ui**
  - Contains shadcn/ui reusable UI components.

- **ModeToggle.tsx**
  - **Libraries**: `react`, `lucide-react`, `next-themes`, custom `button` and `dropdown-menu` components.
  - **Purpose**: Provides a toggle button to switch between light, dark, and system themes.
  - **Usage**: Include this component where theme toggling is required, typically in the layout or header.

- **ProfileAvatar.tsx**
  - **Libraries**: `react`, `@clerk/nextjs`, `react-icons`, custom `avatar` and `dropdown-menu` components.
  - **Purpose**: Displays the user's profile avatar with a dropdown menu for account actions like sign in, sign up, and sign out.
  - **Usage**: Place this component in the layout to provide easy access to user account actions.

- **theme-provider.tsx**
  - **Libraries**: `react`, `next-themes`.
  - **Purpose**: Wraps the application with a theme provider to manage light and dark modes.
  - **Usage**: Wrap the root component in `_app.tsx` with this provider to enable theming throughout the application.
