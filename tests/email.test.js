import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendNewsletter, addSubscriber, removeSubscriber } from '../src/email.js';

// Mock fetch for Resend API calls
global.fetch = vi.fn();

describe('Email Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendNewsletter', () => {
    const mockEnvironment = {
      RESEND_API_KEY: 'test-resend-key',
      NEWSLETTER_FROM_EMAIL: 'test@example.com',
      NEWSLETTER_FROM_NAME: 'Test Newsletter',
      RESEND_AUDIENCE_ID: 'test-audience-id'
    };

    const mockNewsletter = {
      html: '<html><body>Test Newsletter</body></html>',
      subject: 'Test Subject',
      date: 'Mon, 01 Jan 2025'
    };

    it('should send newsletter successfully', async () => {
      const mockResponse = {
        id: 'email-12345',
        from: 'test@example.com',
        to: ['audience:test-audience-id'],
        created_at: '2025-01-01T12:00:00.000Z'
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await sendNewsletter(mockNewsletter, mockEnvironment);

      expect(fetch).toHaveBeenCalledWith(
        'https://api.resend.com/emails',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': 'Bearer test-resend-key',
            'Content-Type': 'application/json'
          },
          body: expect.stringContaining('"to":["audience:test-audience-id"]')
        })
      );

      expect(result).toEqual({
        success: true,
        messageId: 'email-12345',
        details: mockResponse
      });
    });

    it('should handle missing environment variables', async () => {
      const incompleteEnv = {
        RESEND_API_KEY: 'test-key'
        // Missing other required vars
      };

      const result = await sendNewsletter(mockNewsletter, incompleteEnv);

      expect(result).toEqual({
        success: false,
        error: 'Missing required environment variables'
      });
    });

    it('should handle API errors', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.resolve({
          message: 'Invalid email address'
        })
      });

      const result = await sendNewsletter(mockNewsletter, mockEnvironment);

      expect(result).toEqual({
        success: false,
        error: 'Failed to send newsletter: 400 Bad Request'
      });
    });

    it('should handle network errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await sendNewsletter(mockNewsletter, mockEnvironment);

      expect(result).toEqual({
        success: false,
        error: 'Network error'
      });
    });

    it('should validate newsletter structure', async () => {
      const invalidNewsletter = {
        html: '<html><body>Test</body></html>'
        // Missing subject and date
      };

      const result = await sendNewsletter(invalidNewsletter, mockEnvironment);

      expect(result).toEqual({
        success: false,
        error: 'Newsletter must have html, subject, and date'
      });
    });
  });

  describe('addSubscriber', () => {
    const mockEnvironment = {
      RESEND_API_KEY: 'test-resend-key',
      RESEND_AUDIENCE_ID: 'test-audience-id'
    };

    it('should add subscriber successfully', async () => {
      const mockResponse = {
        id: 'contact-12345',
        email: 'test@example.com',
        created_at: '2025-01-01T12:00:00.000Z',
        audience_id: 'test-audience-id'
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await addSubscriber('test@example.com', mockEnvironment);

      expect(fetch).toHaveBeenCalledWith(
        'https://api.resend.com/audiences/test-audience-id/contacts',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': 'Bearer test-resend-key',
            'Content-Type': 'application/json'
          },
          body: '{"email":"test@example.com"}'
        })
      );

      expect(result).toEqual({
        success: true,
        contactId: 'contact-12345',
        details: mockResponse
      });
    });

    it('should handle invalid email addresses', async () => {
      const result = await addSubscriber('invalid-email', mockEnvironment);

      expect(result).toEqual({
        success: false,
        error: 'Invalid email address'
      });
    });

    it('should handle duplicate subscribers', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        statusText: 'Unprocessable Entity',
        json: () => Promise.resolve({
          message: 'Contact already exists'
        })
      });

      const result = await addSubscriber('test@example.com', mockEnvironment);

      expect(result).toEqual({
        success: false,
        error: 'Failed to add subscriber: 422 Unprocessable Entity'
      });
    });
  });

  describe('removeSubscriber', () => {
    const mockEnvironment = {
      RESEND_API_KEY: 'test-resend-key',
      RESEND_AUDIENCE_ID: 'test-audience-id'
    };

    it('should remove subscriber successfully', async () => {
      const mockResponse = {
        id: 'contact-12345',
        deleted: true
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await removeSubscriber('test@example.com', mockEnvironment);

      expect(fetch).toHaveBeenCalledWith(
        'https://api.resend.com/audiences/test-audience-id/contacts/test@example.com',
        expect.objectContaining({
          method: 'DELETE',
          headers: {
            'Authorization': 'Bearer test-resend-key'
          }
        })
      );

      expect(result).toEqual({
        success: true,
        details: mockResponse
      });
    });

    it('should handle non-existent subscribers', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      const result = await removeSubscriber('nonexistent@example.com', mockEnvironment);

      expect(result).toEqual({
        success: false,
        error: 'Failed to remove subscriber: 404 Not Found'
      });
    });

    it('should validate email format', async () => {
      const result = await removeSubscriber('invalid-email', mockEnvironment);

      expect(result).toEqual({
        success: false,
        error: 'Invalid email address'
      });
    });
  });

  describe('email validation', () => {
    it('should validate proper email formats', () => {
      // This would test the internal email validation function if exposed
      // For now, we test it through the public API functions
    });
  });
});