const deleteMock = jest.fn();

jest.mock('@/lib/firebaseAdmin', () => ({
  getAdminApp: jest.fn(() => ({})),
  getStorageBucket: jest.fn(() => 'test-bucket'),
}));

jest.mock('firebase-admin/storage', () => ({
  getStorage: jest.fn(() => ({
    bucket: jest.fn(() => ({
      file: jest.fn(() => ({
        delete: deleteMock,
      })),
    })),
  })),
}));

describe('deleteEventDocumentStorageObject', () => {
  beforeEach(() => {
    deleteMock.mockReset();
    deleteMock.mockResolvedValue(undefined);
  });

  it('deletes Storage object for a valid draft path', async () => {
    const { deleteEventDocumentStorageObject } = await import(
      '@/lib/eventDocuments/storage'
    );
    const result = await deleteEventDocumentStorageObject(
      'eventDocuments/doc1/call-for-entries-v1.pdf',
    );
    expect(deleteMock).toHaveBeenCalledWith({ ignoreNotFound: true });
    expect(result).toEqual({ deleted: true, missing: false });
  });

  it('is idempotent when storagePath is missing', async () => {
    const { deleteEventDocumentStorageObject } = await import(
      '@/lib/eventDocuments/storage'
    );
    await expect(deleteEventDocumentStorageObject(null)).resolves.toEqual({
      deleted: false,
      missing: true,
    });
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it('treats 404 as missing success', async () => {
    deleteMock.mockRejectedValueOnce({ code: 404 });
    const { deleteEventDocumentStorageObject } = await import(
      '@/lib/eventDocuments/storage'
    );
    await expect(
      deleteEventDocumentStorageObject('eventDocuments/doc1/call-for-entries-v1.pdf'),
    ).resolves.toEqual({ deleted: false, missing: true });
  });
});
