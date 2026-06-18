import React from 'react'
import { render, screen, fireEvent, waitFor } from '../setup'
import Scores from '../../pages/scores'

const mockRows = [
  {
    rank: 1,
    userId: '1',
    shooterName: 'Arnold Bailie',
    club: 'Modderbee',
    category: 'open',
    discipline: 'prone_50m',
    average: 578.6,
    best: 578.6,
    averageRings: 550,
    bestRings: 550,
    eventCount: 1,
    seasonEventTotal: 4,
    province: 'North West',
  },
  {
    rank: 2,
    userId: '2',
    shooterName: 'Sarah Johnson',
    club: 'Cape Town RC',
    category: 'senior',
    discipline: 'prone_50m',
    average: 93.2,
    best: 96.0,
    eventCount: 2,
  },
]

describe('Scores Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockRows }),
    }) as jest.Mock
  })

  it('renders rankings page with title', async () => {
    render(<Scores />)

    expect(screen.getByText(/Rankings & Scores/i)).toBeInTheDocument()
    expect(
      screen.getByText(
        /Qualification results only.*season averages by discipline.*Leaderboard page/i,
      ),
    ).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText(/Arnold Bailie/i)).toBeInTheDocument()
    })
  })

  it('displays filter controls', () => {
    render(<Scores />)

    expect(screen.getByText(/All Categories/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Search by name or club/i)).toBeInTheDocument()
  })

  it('displays table headers after data loads', async () => {
    render(<Scores />)

    await waitFor(() => {
      expect(screen.getByText('Rank')).toBeInTheDocument()
      expect(screen.getByText('Shooter')).toBeInTheDocument()
      expect(screen.getByText('Average')).toBeInTheDocument()
    })
  })

  it('renders paired decimal and ring scores when rings available', async () => {
    render(<Scores />)

    await waitFor(() => {
      expect(screen.getAllByText(/578\.6/).length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText(/\(550\)/).length).toBeGreaterThanOrEqual(1)
    })
  })

  it('renders events as competed / total when season total provided', async () => {
    render(<Scores />)

    await waitFor(() => {
      expect(screen.getByText('1 / 4')).toBeInTheDocument()
    })
  })

  it('filters rows by search query', async () => {
    render(<Scores />)

    await waitFor(() => {
      expect(screen.getByText(/Arnold Bailie/i)).toBeInTheDocument()
    })

    fireEvent.change(screen.getByPlaceholderText(/Search by name or club/i), {
      target: { value: 'Sarah' },
    })

    expect(screen.getByText(/Sarah Johnson/i)).toBeInTheDocument()
    expect(screen.queryByText(/Arnold Bailie/i)).not.toBeInTheDocument()
  })
})
