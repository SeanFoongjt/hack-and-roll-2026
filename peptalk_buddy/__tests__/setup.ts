import { vi } from "vitest";

// Mock AsyncStorage for testing
const mockStorage: Record<string, string> = {};

const AsyncStorageMock = {
  getItem: vi.fn(async (key: string) => {
    return mockStorage[key] || null;
  }),
  setItem: vi.fn(async (key: string, value: string) => {
    mockStorage[key] = value;
  }),
  removeItem: vi.fn(async (key: string) => {
    delete mockStorage[key];
  }),
  clear: vi.fn(async () => {
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  }),
  getAllKeys: vi.fn(async () => {
    return Object.keys(mockStorage);
  }),
};

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: AsyncStorageMock,
}));
