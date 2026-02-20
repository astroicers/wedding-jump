import '@testing-library/jest-dom/vitest';
import { useLanguageStore } from './stores/languageStore';

beforeEach(() => {
  useLanguageStore.setState({ language: 'en' });
});
