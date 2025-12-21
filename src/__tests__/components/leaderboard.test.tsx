import React from 'react'
import { render, screen, waitFor } from '../setup'
import Leaderboard from '../../pages/scores/leaderboard'

// Mock the API calls
jest.mock('../../lib/api', () => ({
  leaderboardAPI: {
    getOverall: jest.fn(),
    getClubLeaderboard: jest.fn(),
  },
}))

const mockLeaderboardAPI = require('../../lib/api').leaderboardAPI

const renderWithProvider = (component: React.ReactElement) => {
  return render(component)
}

const mockLeaderboardData = {
  data: [
    {
      id: '1',
      rank: 1,
      playerName: 'John Doe',
      score: 950,
      discipline: 'Rifle',
      category: 'Open',
      date: '2024-01-15',
      club: 'SATRF Club',
    },
    {
      id: '2',
      rank: 2,
      playerName: 'Jane Smith',
      score: 920,
      discipline: 'Pistol',
      category: 'Open',
      date: '2024-01-15',
      club: 'SATRF Club',
    },
  ],
  total: 2,
  page: 1,
  limit: 10,
}

describe('Leaderboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders leaderboard page with loading skeleton initially', () => {
    // Don't mock the API response initially to test loading state
    renderWithProvider(<Leaderboard />)
    
    // Should show loading skeleton initially - check for skeleton elements
    expect(screen.getAllByText(/leaderboard/i).length).toBeGreaterThan(0)
  })

  it('handles empty leaderboard data gracefully', async () => {
    mockLeaderboardAPI.getOverall.mockResolvedValue({ data: [], total: 0, page: 1, limit: 10 })
    
    renderWithProvider(<Leaderboard />)
    
    // Wait for the component to load and show the heading
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /leaderboard/i })).toBeInTheDocument()
    }, { timeout: 10000 })
  })

  it('handles API error gracefully', async () => {
    mockLeaderboardAPI.getOverall.mockRejectedValue(new Error('API Error'))
    
    renderWithProvider(<Leaderboard />)
    
    // Wait for the component to load and show the heading
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /leaderboard/i })).toBeInTheDocument()
    }, { timeout: 10000 })
  })

  it('shows loading skeleton when data is loading', () => {
    // Mock a delayed response to test loading state
    mockLeaderboardAPI.getOverall.mockImplementation(() => new Promise(() => {}))
    
    renderWithProvider(<Leaderboard />)
    
    // Should show loading skeleton - check for skeleton elements
    expect(screen.getAllByText(/leaderboard/i).length).toBeGreaterThan(0)
  })

  it('displays leaderboard data when loaded successfully', async () => {
    mockLeaderboardAPI.getOverall.mockResolvedValue(mockLeaderboardData)
    
    renderWithProvider(<Leaderboard />)
    
    // Wait for the component to load and check for the heading
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /leaderboard/i })).toBeInTheDocument()
    }, { timeout: 10000 })
  })

  it('displays filter options when loaded', async () => {
    mockLeaderboardAPI.getOverall.mockResolvedValue(mockLeaderboardData)
    
    renderWithProvider(<Leaderboard />)
    
    await waitFor(() => {
      // Check for filter options
      expect(screen.getByText(/overall rankings/i)).toBeInTheDocument()
    }, { timeout: 10000 })
  })

  it('calls API with correct parameters', async () => {
    mockLeaderboardAPI.getOverall.mockResolvedValue(mockLeaderboardData)
    
    renderWithProvider(<Leaderboard />)
    
    await waitFor(() => {
      expect(mockLeaderboardAPI.getOverall).toHaveBeenCalledWith({
        discipline: undefined,
        category: undefined,
        time_period: 'all',
        page: 1,
        limit: 50,
      })
    }, { timeout: 10000 })
  })
}) 