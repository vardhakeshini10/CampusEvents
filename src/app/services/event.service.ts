
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CampusEvent {
  _id?: string;
  id?: number;
  title: string;
  category: string;
  description: string;
  date: string;
  time: string;
  venue: string;
}

export interface Registration {
  _id: string;
  studentEmail: string;
  eventId: string | CampusEvent;
  eventTitle: string;
}

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private apiUrl = 'http://localhost:3000/api/events';
  private registrationUrl = 'http://localhost:3000/api/registrations';

  constructor(private http: HttpClient) {}

  // Get all events
  getEvents(): Observable<CampusEvent[]> {
    return this.http.get<CampusEvent[]>(this.apiUrl);
  }

  // Create an event
  createEvent(event: CampusEvent): Observable<CampusEvent> {
    return this.http.post<CampusEvent>(this.apiUrl, event);
  }

  // Update an event
  updateEvent(id: string, event: CampusEvent): Observable<CampusEvent> {
    return this.http.put<CampusEvent>(`${this.apiUrl}/${id}`, event);
  }

  // Delete an event
  deleteEvent(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.apiUrl}/${id}`
    );
  }

  // Register a student for an event
  registerForEvent(
    studentEmail: string,
    eventId: string
  ): Observable<Registration> {
    return this.http.post<Registration>(this.registrationUrl, {
      studentEmail,
      eventId
    });
  }

  // Get a student's registrations
  getRegistrations(studentEmail: string): Observable<Registration[]> {
    return this.http.get<Registration[]>(
      `${this.registrationUrl}/${encodeURIComponent(studentEmail)}`
    );
  }

  // Cancel a registration
  cancelRegistration(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.registrationUrl}/${id}`
    );
  }
}
