import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import AdminScoreImport from '../pages/admin/scores/import';
import FileUploadComponent from '../components/admin/FileUploadComponent';
import ManualEntryComponent from '../components/admin/ManualEntryComponent';

// Mock the API calls
global.fetch = jest.fn();

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

// Mock XLSX
jest.mock('xlsx', () => ({
  read: jest.fn(),
  utils: {
    sheet_to_json: jest.fn(),
  },
}));

const renderWithChakra = (component: React.ReactElement) => {
  return render(
    <ChakraProvider>
      {component}
    </ChakraProvider>
  );
};

describe('Admin Score Import', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('Main Import Page', () => {
    it('renders the main import page with tabs', () => {
      renderWithChakra(<AdminScoreImport />);
      
      expect(screen.getByText('Admin Score Import & Entry')).toBeInTheDocument();
      expect(screen.getByText('Upload Excel/CSV')).toBeInTheDocument();
      expect(screen.getByText('Manual Entry')).toBeInTheDocument();
      expect(screen.getByText('📥 Download Excel Template')).toBeInTheDocument();
    });

    it('switches between tabs', () => {
      renderWithChakra(<AdminScoreImport />);
      
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

    it('shows file name when file is uploaded', () => {
      const mockProps = {
        onImportSuccess: jest.fn(),
        onImportError: jest.fn(),
        isLoading: false,
        setIsLoading: jest.fn(),
      };

      renderWithChakra(<FileUploadComponent {...mockProps} />);
      
      // Simulate file upload
      const file = new File(['test'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const input = screen.getByDisplayValue('');
      
      fireEvent.change(input, { target: { files: [file] } });
      
      expect(screen.getByText('test.xlsx')).toBeInTheDocument();
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
        expect(mockProps.onImportError).toHaveBeenCalledWith('No valid scores to save');
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
      
      // Fill in series scores
      const series1Input = screen.getByDisplayValue('0');
      fireEvent.change(series1Input, { target: { value: '95.5' } });
      
      // Total should be updated
      const totalInput = screen.getByDisplayValue('95.5');
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
      
      // Fill series scores
      const series1Input = screen.getByDisplayValue('0');
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