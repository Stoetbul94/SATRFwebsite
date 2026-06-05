import React from 'react'
import { render, screen, fireEvent, waitFor } from '../setup'
import Scores from '../../pages/scores'

const mockRows = [
  {
    rank: 1,
    userId: '1',
    shooterName: 'John Smith',
    club: 'SATRF Club',
    category: 'senior',
    discipline: 'prone_50m',
    average: 95.5,
    best: 98.0,
    eventCount: 3,
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
    expect(screen.getByText(/National rankings by average decimal total/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText(/John Smith/i)).toBeInTheDocument()
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

  it('filters rows by search query', async () => {
    render(<Scores />)

    await waitFor(() => {
      expect(screen.getByText(/John Smith/i)).toBeInTheDocument()
    })

    fireEvent.change(screen.getByPlaceholderText(/Search by name or club/i), {
      target: { value: 'Sarah' },
    })

    expect(screen.getByText(/Sarah Johnson/i)).toBeInTheDocument()
    expect(screen.queryByText(/John Smith/i)).not.toBeInTheDocument()
  })
})
