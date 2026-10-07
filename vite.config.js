import { defineConfig } from 'vite';

const repository = process.env.GITHUB_REPOSITORY?.split('/')[1];
const isProjectPagesBuild = Boolean(
  process.env.GITHUB_ACTIONS && repository && !repository.endsWith('.github.io'),
);

export default defineConfig({
  base: isProjectPagesBuild ? `/${repository}/` : '/',
});
