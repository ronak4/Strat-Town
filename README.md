Deployment link: https://summer25-project-minior-wjbu.onrender.com/login 

## Getting Started

Run `npm install` in the root directory to install all dependencies for the `client`, `server`, and `shared` folders.

To run strategy.town locally in development mode, open two terminal windows:
 - In the first, navigate to the `server` directory and run `npm run dev`
 - In the second, navigate to the `client` directory and also run `npm run dev`

The second terminal window, the one in the `client` directory, shows a URL that you should go to to preview the application, probably <http://localhost:4530/>. You can use the default username/password combinations user0/pwd0, user1/pwd1, user2/pwd2, and user3/pwd3 to log in.

### Checking the application

Checks can be run on every part of the application at once by running the following commands from the repository root:

- `npm run check --workspaces` - Checks all three projects with TypeScript
- `npm run lint --workspaces` - Checks all three projects with ESLint
- `npm run test --workspaces` - Runs Vitest tests on all three projects

### Building the application

Running `npm run build -w=client` in the root of the repository will build the client. Then, the server can be started in production mode by running `npm start -w=server` and accessed by going to <http://localhost:8000/>.

## Codebase Folder Structure

- `client`: Contains the frontend application code, responsible for the user interface and interacting with the backend. This directory includes all React components and related assets.
- `server`: Contains the backend application code, handling the logic, APIs, and database interactions. It serves requests from the client and processes data accordingly.
- `shared`: Contains all shared type definitions that are used by both the client and server. This helps maintain consistency and reduces duplication of code between the two folders.