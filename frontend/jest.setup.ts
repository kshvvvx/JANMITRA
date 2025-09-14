// @ts-nocheck
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
import 'react-native-gesture-handler/jestSetup';

// Add TypeScript support for Jest
type JestMock = {
  fn: () => jest.Mock;
  clearAllMocks: () => void;
  restoreAllMocks: () => void;
  mock: {
    fn: () => jest.Mock;
  };
};

declare const jest: JestMock;
declare const beforeEach: (fn: () => void) => void;
declare const afterEach: (fn: () => void) => void;

// Mock AsyncStorage
const mockStorage = {
  ...mockAsyncStorage,
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Mock expo constants
const mockConstants = {
  manifest: {},
  sessionId: 'test-session-id',
  deviceName: 'Test Device',
  nativeAppVersion: '1.0.0',
  nativeBuildVersion: '1',
};

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  // Using dynamic import to avoid require()
  const Reanimated = jest.requireActual('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock navigation
const mockedNavigate = jest.fn();
const mockNavigation = {
  navigate: mockedNavigate,
  dispatch: jest.fn(),
  goBack: jest.fn(),
  reset: jest.fn(),
};

// Mock react-navigation
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => mockNavigation,
  useRoute: () => ({
    params: {},
    key: 'test-route',
    name: 'TestScreen',
  }),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => mockStorage);

// Mock expo-constants
jest.mock('expo-constants', () => mockConstants);

// Mock Animated helper to silence warnings
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Setup fetch mock
type FetchResponse = {
  ok: boolean;
  status: number;
  json: () => Promise<any>;
};

type FetchMock = jest.Mock<Promise<FetchResponse>, [string, RequestInit?]> & {
  mockResolvedValue: (value: any) => void;
  mockImplementation: (impl: (...args: any[]) => any) => void;
};

const mockFetch = jest.fn() as FetchMock;

global.fetch = mockFetch;

declare global {
  var fetch: FetchMock;
}

// Setup test environment
beforeEach(() => {
  jest.clearAllMocks();
  
  mockFetch.mockImplementation(() =>
    Promise.resolve({
      ok: true,
      json: async () => ({}),
    })
  );
});

afterEach(() => {
  jest.restoreAllMocks();
});
