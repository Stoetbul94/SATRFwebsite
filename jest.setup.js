// Ensure matchers are added in a CommonJS-friendly way for Jest
require('@testing-library/jest-dom')

// Set NODE_ENV to test to ensure React development builds are used
process.env.NODE_ENV = 'test'

// Mock FullCalendar to avoid ES module issues
jest.mock('@fullcalendar/core', () => ({
  Calendar: jest.fn().mockImplementation(() => ({
    render: jest.fn(),
    destroy: jest.fn(),
    getOption: jest.fn(),
    setOption: jest.fn(),
    addEventSource: jest.fn(),
    removeEventSource: jest.fn(),
    getEvents: jest.fn(() => []),
    addEvent: jest.fn(),
    removeEvent: jest.fn(),
    updateEvent: jest.fn(),
    select: jest.fn(),
    unselect: jest.fn(),
    changeView: jest.fn(),
    next: jest.fn(),
    prev: jest.fn(),
    today: jest.fn(),
    gotoDate: jest.fn(),
    incrementDate: jest.fn(),
    getDate: jest.fn(() => new Date()),
    getView: jest.fn(() => ({ title: 'Test View' })),
    on: jest.fn(),
    off: jest.fn(),
    trigger: jest.fn(),
  })),
  createPlugin: jest.fn(),
  defineOptions: jest.fn(),
  defineGlobals: jest.fn(),
  requestJson: jest.fn(),
  htmlEscape: jest.fn(),
  cssToStr: jest.fn(),
  createElement: jest.fn(),
  applyAll: jest.fn(),
  debounce: jest.fn(),
  isInt: jest.fn(),
  htmlEscape: jest.fn(),
  cssToStr: jest.fn(),
  createElement: jest.fn(),
  applyAll: jest.fn(),
  debounce: jest.fn(),
  isInt: jest.fn(),
}))

jest.mock('@fullcalendar/react', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(function(props) {
    const React = require('react');
    const { events, eventClick, ...otherProps } = props;
    return React.createElement('div', {
      'data-testid': 'fullcalendar',
      ...otherProps,
    }, events && events.map(function(event) {
      return React.createElement('div', {
        key: event.id,
        'data-testid': 'calendar-event-' + event.id,
        onClick: function() {
          if (eventClick) {
            eventClick({ event: { extendedProps: { event: event.extendedProps && event.extendedProps.event } } });
          }
        },
      }, event.title);
    }));
  }),
}))

jest.mock('@fullcalendar/daygrid', () => ({
  DayGridView: jest.fn(),
  DayGrid: jest.fn(),
}))

jest.mock('@fullcalendar/timegrid', () => ({
  TimeGridView: jest.fn(),
  TimeGrid: jest.fn(),
}))

jest.mock('@fullcalendar/interaction', () => ({
  DateSelecting: jest.fn(),
  EventResizing: jest.fn(),
  EventDragging: jest.fn(),
}))

jest.mock('@fullcalendar/list', () => ({
  ListView: jest.fn(),
  List: jest.fn(),
}))

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      replace: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
    }
  },
}))

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element
    const React = require('react');
    return React.createElement('img', {
      ...props,
      src: props.src,
      alt: props.alt,
      width: props.width,
      height: props.height,
    });
  },
}))

// Mock Next.js Link component
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }) => {
    const React = require('react');
    return React.createElement('a', { href, ...props }, children);
  },
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock structuredClone for older Node versions
if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (obj) => JSON.parse(JSON.stringify(obj))
}

// Global test cleanup and memory management
afterEach(() => {
  // Clear all mocks
  jest.clearAllMocks();
});

// Increase memory limits for tests
process.setMaxListeners(0);

// Mock framer-motion to prevent test failures
jest.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: {
      div: React.forwardRef(({ children, ...props }, ref) => React.createElement('div', { ...props, ref }, children)),
      span: React.forwardRef(({ children, ...props }, ref) => React.createElement('span', { ...props, ref }, children)),
      button: React.forwardRef(({ children, ...props }, ref) => React.createElement('button', { ...props, ref }, children)),
    },
    AnimatePresence: ({ children }) => children,
    useAnimation: () => ({ start: jest.fn(), stop: jest.fn() }),
    useMotionValue: (initial) => ({ get: () => initial, set: jest.fn() }),
    useTransform: (value, input, output) => ({ get: () => output }),
    useIsPresent: () => true,
  };
});

// Mock Chakra UI toast to prevent test failures
jest.mock('@chakra-ui/toast', () => {
  const React = require('react');
  return {
    useToast: () => ({
      toast: jest.fn(),
      close: jest.fn(),
      closeAll: jest.fn(),
      isActive: jest.fn(),
      update: jest.fn(),
    }),
  };
}); 