import React from 'react'
import { render, screen, waitFor } from '../setup'
import Leaderboard from '../../pages/scores/leaderboard'

const mockFinalsRows = [
  {
    rank: 1,
    shooterName: 'John Doe',
    club: 'SATRF Club',
    category: 'senior',
    discipline: 'prone_50m',
    decimalTotal: 95.5,
    finalRank: 1,
    eventName: 'SATRF Championship',
    date: '2024-01-15',
  },
  {
    rank: 2,
    shooterName: 'Jane Smith',
    club: 'Cape Town RC',
    category: 'senior',
    discipline: 'prone_50m',
    decimalTotal: 92.0,
    finalRank: 2,
    eventName: 'SATRF Championship',
    date: '2024-01-15',
  },
]

describe('Leaderboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockFinalsRows }),
    }) as jest.Mock
  })

  it('renders finals leaderboard page with title and subtitle', async () => {
    render(<Leaderboard />)

    expect(screen.getByRole('heading', { name: /Finals Leaderboard/i })).toBeInTheDocument()
    expect(
      screen.getByText(
        /Finals results only.*ranked by final score.*Scores page/i,
      ),
    ).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText(/John Doe/i)).toBeInTheDocument()
    })
  })

  it('displays filter controls', () => {
    render(<Leaderboard />)

    expect(screen.getByText(/All Categories/i)).toBeInTheDocument()
  })

  it('displays table headers after data loads', async () => {
    render(<Leaderboard />)

    await waitFor(() => {
      expect(screen.getByText('Rank')).toBeInTheDocument()
      expect(screen.getByText('Shooter')).toBeInTheDocument()
      expect(screen.getByText('Final Total')).toBeInTheDocument()
    })
  })

  it('handles empty finals data gracefully', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    }) as jest.Mock

    render(<Leaderboard />)

    await waitFor(() => {
      expect(screen.getByText(/No finals results yet/i)).toBeInTheDocument()
    })
  })

  it('calls finals API with default discipline', async () => {
    render(<Leaderboard />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/leaderboard/finals?discipline=prone_50m'),
      )
    })
  })
})
