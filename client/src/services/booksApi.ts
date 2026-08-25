import { request } from './api';
import { Book, BookNote, BookQuote } from '../types';

export const booksApi = {
  getBooks: async (): Promise<Book[]> => request('/library/books'),
  getBookById: async (id: string): Promise<Book> => request(`/library/books/${id}`),

  createBook: async (formData: FormData): Promise<Book> =>
    request('/library/books', { method: 'POST', body: formData }),

  updateBook: async (id: string, formData: FormData | Partial<Book>): Promise<Book> => {
    const isFormData = formData instanceof FormData;
    return request(`/library/books/${id}`, {
      method: 'PUT',
      body: isFormData ? formData : JSON.stringify(formData),
    });
  },

  deleteBook: async (id: string): Promise<{ id: string }> =>
    request(`/library/books/${id}`, { method: 'DELETE' }),

  addNote: async (bookId: string, noteData: { content: string; chapterTitle?: string; pageNumber?: number }): Promise<BookNote> =>
    request(`/library/books/${bookId}/notes`, { method: 'POST', body: JSON.stringify(noteData) }),

  getQuotes: async (): Promise<BookQuote[]> => request('/library/quotes'),
  addQuote: async (quoteData: Partial<BookQuote>): Promise<BookQuote> =>
    request('/library/quotes', { method: 'POST', body: JSON.stringify(quoteData) }),
  deleteQuote: async (id: string): Promise<{ id: string }> =>
    request(`/library/quotes/${id}`, { method: 'DELETE' }),
};
