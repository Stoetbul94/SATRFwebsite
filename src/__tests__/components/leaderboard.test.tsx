import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import Leaderboard from '../../pages/scores/leaderboard'

// Mock the API calls
jest.mock('../../lib/api', () => ({
  getLeaderboard: jest.fn(),
}))

const mockGetLeaderboard = require('../../lib/api').getLeaderboard

const renderWithProvider = (component: React.ReactElement) => {
  return render(component)
}

const mockLeaderboardData = [
  {
    id: '1',
    rank: 1,
    playerName: 'John Doe',
    score: 950,
    discipline: 'Rifle',
    date: '2024-01-15',
  },
  {
    id: '2',
    rank: 2,
    playerName: 'Jane Smith',
    score: 920,
    discipline: 'Pistol',
    date: '2024-01-14',
  },
  {
    id: '3',
    rank: 3,
    playerName: 'Bob Johnson',
    score: 890,
    discipline: 'Rifle',
    date: '2024-01-13',
  },
]

describe('Leaderboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders leaderboard with loading state initially', () => {
    mockGetLeaderboard.mockImplementation(() => new Promise(() => {}))
    renderWithProvider(<Leaderboard />)
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('displays leaderboard data when loaded', async () => {
    mockGetLeaderboard.mockResolvedValueOnce(mockLeaderboardData)
    renderWithProvider(<Leaderboard />)
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument()
    })
  })

  it('displays correct rank numbers', async () => {
    mockGetLeaderboard.mockResolvedValueOnce(mockLeaderboardData)
    renderWithProvider(<Leaderboard />)
    
    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
    })
  })

  it('displays scores correctly', async () => {
    mockGetLeaderboard.mockResolvedValueOnce(mockLeaderboardData)
    renderWithProvider(<Leaderboard />)
    
    await waitFor(() => {
      expect(screen.getByText('950')).toBeInTheDocument()
      expect(screen.getByText('920')).toBeInTheDocument()
      expect(screen.getByText('890')).toBeInTheDocument()
    })
  })

  it('displays disciplines correctly', async () => {
    mockGetLeaderboard.mockResolvedValueOnce(mockLeaderboardData)
    renderWithProvider(<Leaderboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Rifle')).toBeInTheDocument()
      expect(screen.getByText('Pistol')).toBeInTheDocument()
    })
  })

  it('handles empty leaderboard data', async () => {
    mockGetLeaderboard.mockResolvedValueOnce([])
    renderWithProvider(<Leaderboard />)
    
    await waitFor(() => {
      expect(screen.getByText(/no scores available/i)).toBeInTheDocument()
    })
  })

  it('handles API error gracefully', async () => {
    const errorMessage = 'Failed to fetch leaderboard'
    mockGetLeaderboard.mockRejectedValueOnce(new Error(errorMessage))
    renderWithProvider(<Leaderboard />)
    
    await waitFor(() => {
      expect(screen.getByText(/error loading leaderboard/i)).toBeInTheDocument()
    })
  })

  it('calls API with correct parameters', async () => {
    mockGetLeaderboard.mockResolvedValueOnce(mockLeaderboardData)
    renderWithProvider(<Leaderboard />)
    
    await waitFor(() => {
      expect(mockGetLeaderboard).toHaveBeenCalledWith()
    })
  })

  it('displays table headers correctly', async () => {
    mockGetLeaderboard.mockResolvedValueOnce(mockLeaderboardData)
    renderWithProvider(<Leaderboard />)
    
    await waitFor(() => {
      expect(screen.getByText(/rank/i)).toBeInTheDocument()
      expect(screen.getByText(/player/i)).toBeInTheDocument()
      expect(screen.getByText(/score/i)).toBeInTheDocument()
      expect(screen.getByText(/discipline/i)).toBeInTheDocument()
      expect(screen.getByText(/date/i)).toBeInTheDocument()
    })
  })
}) 