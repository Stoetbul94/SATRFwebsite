// Mock XLSX before imports
jest.mock('xlsx', () => ({
  read: jest.fn(),
  utils: {
    sheet_to_json: jest.fn(),
  },
}));

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import AdminScoreImport from '../pages/admin/scores/import';
import FileUploadComponent from '../components/admin/FileUploadComponent';
import ManualEntryComponent from '../components/admin/ManualEntryComponent';
import { AuthProvider } from '../contexts/AuthContext';

// Mock the API calls
global.fetch = jest.fn();

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

// Get the mocked XLSX module
const mockXLSX = require('xlsx');

const renderWithChakra = (component: React.ReactElement) => {
  return render(
    <ChakraProvider>
      {component}
    </ChakraProvider>
  );
};

const renderWithAuthAndChakra = (component: React.ReactElement) => {
  return render(
    <ChakraProvider>
      <AuthProvider>
        {component}
      </AuthProvider>
    </ChakraProvider>
  );
};

describe('Admin Score Import', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    jest.clearAllMocks();
  });

  describe('Main Import Page', () => {
    it('renders the main import page with tabs', () => {
      renderWithAuthAndChakra(<AdminScoreImport />);
      
      expect(screen.getByText('Admin Score Import & Entry')).toBeInTheDocument();
      expect(screen.getByText('Upload Excel/CSV')).toBeInTheDocument();
      expect(screen.getByText('Manual Entry')).toBeInTheDocument();
      expect(screen.getByText('📥 Download Excel Template')).toBeInTheDocument();
    });

    it('switches between tabs', () => {
      renderWithAuthAndChakra(<AdminScoreImport />);
      
      const manualTab = screen.getByText('Manual Entry');
      fireEvent.click(manualTab);
      
      expect(screen.getByText('Manual Score Entry')).toBeInTheDocument();
    });
  });

  describe('File Upload Component', () => {
    it('renders file upload area', () => {
      const mockProps = {
        onImportSuccess: jest.fn(),
        onImportError: jest.fn(),
        isLoading: false,
        setIsLoading: jest.fn(),
      };

      renderWithChakra(<FileUploadComponent {...mockProps} />);
      
      expect(screen.getByText('Drag & drop Excel/CSV file here')).toBeInTheDocument();
      expect(screen.getByText('or click to browse files')).toBeInTheDocument();
    });

    it('shows file name when file is uploaded', async () => {
      const mockProps = {
        onImportSuccess: jest.fn(),
        onImportError: jest.fn(),
        isLoading: false,
        setIsLoading: jest.fn(),
      };

      // Mock successful XLSX parsing
      mockXLSX.read.mockReturnValue({
        SheetNames: ['Sheet1'],
        Sheets: {
          Sheet1: {}
        }
      });
      
      mockXLSX.utils.sheet_to_json.mockReturnValue([
        ['Event', 'Match', 'Shooter', 'Club', 'Division', 'Veteran', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'Total', 'Place'],
        ['Prone Match 1', '1', 'John Doe', 'Test Club', 'Open', 'N', '95', '96', '97', '98', '99', '100', '585', '1']
      ]);

      renderWithChakra(<FileUploadComponent {...mockProps} />);
      
      // Simulate file upload
      const file = new File(['test'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const input = screen.getByTestId('file-drop-zone').querySelector('input');
      
      if (input) {
        fireEvent.change(input, { target: { files: [file] } });
        
        await waitFor(() => {
          expect(screen.getByText('test.xlsx')).toBeInTheDocument();
        });
      }
    });
  });

  describe('Manual Entry Component', () => {
    it('renders manual entry interface', () => {
      const mockProps = {
        onImportSuccess: jest.fn(),
        onImportError: jest.fn(),
        isLoading: false,
        setIsLoading: jest.fn(),
      };

      renderWithChakra(<ManualEntryComponent {...mockProps} />);
      
      expect(screen.getByText('Manual Score Entry')).toBeInTheDocument();
      expect(screen.getByText('Add Row')).toBeInTheDocument();
      expect(screen.getByText('No scores entered yet')).toBeInTheDocument();
    });

    it('adds a new row when Add Row is clicked', () => {
      const mockProps = {
        onImportSuccess: jest.fn(),
        onImportError: jest.fn(),
        isLoading: false,
        setIsLoading: jest.fn(),
      };

      renderWithChakra(<ManualEntryComponent {...mockProps} />);
      
      const addRowButton = screen.getByText('Add Row');
      fireEvent.click(addRowButton);
      
      // Should show the table headers
      expect(screen.getByText('Event')).toBeInTheDocument();
      expect(screen.getByText('Match #')).toBeInTheDocument();
      expect(screen.getByText('Shooter')).toBeInTheDocument();
    });

    it('validates required fields', async () => {
      const mockProps = {
        onImportSuccess: jest.fn(),
        onImportError: jest.fn(),
        isLoading: false,
        setIsLoading: jest.fn(),
      };

      renderWithChakra(<ManualEntryComponent {...mockProps} />);
      
      // Add a row
      const addRowButton = screen.getByText('Add Row');
      fireEvent.click(addRowButton);
      
      // Try to save without filling required fields
      const saveButton = screen.getByText(/Save.*Valid Scores/);
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        // Check that onImportError was called with some error message
        expect(mockProps.onImportError).toHaveBeenCalled();
        const errorCall = mockProps.onImportError.mock.calls[0][0];
        expect(typeof errorCall).toBe('string');
        expect(errorCall.length).toBeGreaterThan(0);
      });
    });

    it('auto-calculates total from series scores', () => {
      const mockProps = {
        onImportSuccess: jest.fn(),
        onImportError: jest.fn(),
        isLoading: false,
        setIsLoading: jest.fn(),
      };

      renderWithChakra(<ManualEntryComponent {...mockProps} />);
      
      // Add a row
      const addRowButton = screen.getByText('Add Row');
      fireEvent.click(addRowButton);
      
      // Fill in series scores - use getAllByDisplayValue and select the first one
      const seriesInputs = screen.getAllByDisplayValue('0');
      const series1Input = seriesInputs[0]; // First series input
      fireEvent.change(series1Input, { target: { value: '95.5' } });
      
      // Total should be updated - look for the readonly total input specifically
      const totalInputs = screen.getAllByDisplayValue('95.5');
      const totalInput = totalInputs.find(input => input.hasAttribute('readonly'));
      expect(totalInput).toBeInTheDocument();
    });
  });

  describe('API Integration', () => {
    it('calls API when importing valid scores', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Scores imported successfully' }),
      } as Response);

      const mockProps = {
        onImportSuccess: jest.fn(),
        onImportError: jest.fn(),
        isLoading: false,
        setIsLoading: jest.fn(),
      };

      renderWithChakra(<ManualEntryComponent {...mockProps} />);
      
      // Add a row and fill valid data
      const addRowButton = screen.getByText('Add Row');
      fireEvent.click(addRowButton);
      
      // Fill in required fields
      const eventSelect = screen.getByDisplayValue('Select Event');
      fireEvent.change(eventSelect, { target: { value: 'Prone Match 1' } });
      
      const matchInput = screen.getByPlaceholderText('Match #');
      fireEvent.change(matchInput, { target: { value: '001' } });
      
      const shooterInput = screen.getByPlaceholderText('Shooter Name');
      fireEvent.change(shooterInput, { target: { value: 'John Doe' } });
      
      const clubInput = screen.getByPlaceholderText('Club');
      fireEvent.change(clubInput, { target: { value: 'SATRF Club' } });
      
      const divisionSelect = screen.getByDisplayValue('Select Division');
      fireEvent.change(divisionSelect, { target: { value: 'Open' } });
      
      const veteranSelect = screen.getByDisplayValue('Y/N');
      fireEvent.change(veteranSelect, { target: { value: 'N' } });
      
      // Fill series scores - use getAllByDisplayValue and select the first one
      const seriesInputs = screen.getAllByDisplayValue('0');
      const series1Input = seriesInputs[0]; // First series input
      fireEvent.change(series1Input, { target: { value: '95.5' } });
      
      // Save
      const saveButton = screen.getByText(/Save.*Valid Scores/);
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/admin/scores/import', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining('John Doe'),
        });
      });
    });
  });
}); 