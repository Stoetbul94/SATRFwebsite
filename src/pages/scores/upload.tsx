import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { FiUpload, FiFile, FiX, FiCalendar, FiTarget, FiAward } from 'react-icons/fi';
import { useDropzone } from 'react-dropzone';
import Layout from '@/components/layout/Layout';
import { scoresAPI, eventsAPI } from '@/lib/api';
import type { Event } from '@/lib/api';

// Score upload form schema
const scoreUploadSchema = z.object({
  eventId: z.string().min(1, 'Please select an event'),
  discipline: z.string().min(2, 'Please select a discipline'),
  score: z.number()
    .min(0, 'Score must be at least 0')
    .max(600, 'Score cannot exceed 600'),
  xCount: z.number()
    .min(0, 'X-count must be at least 0')
    .max(60, 'X-count cannot exceed 60')
    .optional(),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
});

type ScoreUploadFormData = z.infer<typeof scoreUploadSchema>;

export default function ScoreUpload() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ScoreUploadFormData>({
    resolver: zodResolver(scoreUploadSchema),
    mode: 'onChange',
  });

  const selectedEventId = watch('eventId');

  // Fetch events for dropdown
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const eventsData = await eventsAPI.getAll({ status: 'open' });
        setEvents(eventsData);
      } catch (error) {
        console.error('Error fetching events:', error);
        toast.error('Failed to load events');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // File dropzone configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'application/pdf': ['.pdf'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setSelectedFile(acceptedFiles[0]);
      }
    },
  });

  const onSubmit = async (data: ScoreUploadFormData) => {
    setIsSubmitting(true);
    
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('score_data', JSON.stringify(data));
      
      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      await scoresAPI.upload(data);
      
      toast.success('Score uploaded successfully! It will be reviewed by an administrator.');
      
      // Reset form
      reset();
      setSelectedFile(null);
      
      // Redirect to scores page
      router.push('/scores');
    } catch (error: any) {
      console.error('Score upload error:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Failed to upload score. Please try again.';
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <div className="card animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-8"></div>
              <div className="space-y-4">
                <div className="h-12 bg-gray-200 rounded"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Upload Score
            </h1>
            <p className="text-gray-600">
              Submit your shooting score for review and inclusion in the leaderboard
            </p>
          </div>

          {/* Score Upload Form */}
          <div className="card">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Event Selection */}
              <div>
                <label htmlFor="eventId" className="form-label">
                  <FiCalendar className="inline mr-2" />
                  Event
                </label>
                <select
                  id="eventId"
                  {...register('eventId')}
                  className={`input-field ${errors.eventId ? 'border-red-500' : ''}`}
                  aria-describedby={errors.eventId ? 'eventId-error' : undefined}
                  aria-invalid={!!errors.eventId}
                >
                  <option value="">Select an event</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.title} - {new Date(event.date).toLocaleDateString()}
                    </option>
                  ))}
                </select>
                {errors.eventId && (
                  <p id="eventId-error" className="form-error" role="alert">
                    {errors.eventId.message}
                  </p>
                )}
              </div>

              {/* Discipline Selection */}
              <div>
                <label htmlFor="discipline" className="form-label">
                  <FiTarget className="inline mr-2" />
                  Discipline
                </label>
                <select
                  id="discipline"
                  {...register('discipline')}
                  className={`input-field ${errors.discipline ? 'border-red-500' : ''}`}
                  aria-describedby={errors.discipline ? 'discipline-error' : undefined}
                  aria-invalid={!!errors.discipline}
                >
                  <option value="">Select discipline</option>
                  <option value="10m Air Rifle">10m Air Rifle</option>
                  <option value="10m Air Pistol">10m Air Pistol</option>
                  <option value="50m Rifle 3 Positions">50m Rifle 3 Positions</option>
                  <option value="50m Rifle Prone">50m Rifle Prone</option>
                  <option value="25m Rapid Fire Pistol">25m Rapid Fire Pistol</option>
                  <option value="25m Standard Pistol">25m Standard Pistol</option>
                  <option value="25m Center Fire Pistol">25m Center Fire Pistol</option>
                  <option value="50m Pistol">50m Pistol</option>
                  <option value="Skeet">Skeet</option>
                  <option value="Trap">Trap</option>
                  <option value="Double Trap">Double Trap</option>
                </select>
                {errors.discipline && (
                  <p id="discipline-error" className="form-error" role="alert">
                    {errors.discipline.message}
                  </p>
                )}
              </div>

              {/* Score and X-Count */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="score" className="form-label">
                    <FiAward className="inline mr-2" />
                    Score
                  </label>
                  <input
                    id="score"
                    type="number"
                    min="0"
                    max="600"
                    {...register('score', { valueAsNumber: true })}
                    className={`input-field ${errors.score ? 'border-red-500' : ''}`}
                    placeholder="0-600"
                    aria-describedby={errors.score ? 'score-error' : undefined}
                    aria-invalid={!!errors.score}
                  />
                  {errors.score && (
                    <p id="score-error" className="form-error" role="alert">
                      {errors.score.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="xCount" className="form-label">
                    <FiAward className="inline mr-2" />
                    X-Count (Optional)
                  </label>
                  <input
                    id="xCount"
                    type="number"
                    min="0"
                    max="60"
                    {...register('xCount', { valueAsNumber: true })}
                    className={`input-field ${errors.xCount ? 'border-red-500' : ''}`}
                    placeholder="0-60"
                    aria-describedby={errors.xCount ? 'xCount-error' : undefined}
                    aria-invalid={!!errors.xCount}
                  />
                  {errors.xCount && (
                    <p id="xCount-error" className="form-error" role="alert">
                      {errors.xCount.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="notes" className="form-label">
                  Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  rows={3}
                  {...register('notes')}
                  className={`input-field ${errors.notes ? 'border-red-500' : ''}`}
                  placeholder="Any additional notes about your performance..."
                  aria-describedby={errors.notes ? 'notes-error' : undefined}
                  aria-invalid={!!errors.notes}
                />
                {errors.notes && (
                  <p id="notes-error" className="form-error" role="alert">
                    {errors.notes.message}
                  </p>
                )}
              </div>

              {/* File Upload */}
              <div>
                <label className="form-label">
                  <FiFile className="inline mr-2" />
                  Score Sheet (Optional)
                </label>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? 'border-satrf-lightBlue bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input {...getInputProps()} />
                  {selectedFile ? (
                    <div className="flex items-center justify-center space-x-2">
                      <FiFile className="text-satrf-lightBlue text-xl" />
                      <span className="text-sm text-gray-600">{selectedFile.name}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile();
                        }}
                        className="text-red-500 hover:text-red-700"
                        aria-label="Remove file"
                      >
                        <FiX className="text-lg" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <FiUpload className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600">
                        {isDragActive
                          ? 'Drop the file here...'
                          : 'Drag and drop a file here, or click to select'}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        PDF, JPG, PNG up to 10MB
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                aria-describedby="submit-status"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Uploading Score...
                  </div>
                ) : (
                  'Upload Score'
                )}
              </button>
              <div id="submit-status" className="sr-only" aria-live="polite">
                {isSubmitting ? 'Uploading score...' : 'Ready to submit'}
              </div>
            </form>
          </div>

          {/* Information Box */}
          <div className="mt-6 card bg-blue-50 border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Important Information
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Scores will be reviewed by administrators before approval</li>
              <li>• Only approved scores appear on the leaderboard</li>
              <li>• You can upload score sheets as supporting documentation</li>
              <li>• X-count is optional but helps with tie-breaking</li>
              <li>• Contact support if you need to modify a submitted score</li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
} 