
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import {
  EventService,
  CampusEvent as DatabaseEvent,
  Registration
} from '../../services/event.service';

interface StudentEvent extends DatabaseEvent {
  icon: string;
  color: string;
  registered: boolean;
  registrationId?: string;
}

interface LoggedInUser {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
}

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-dashboard.html',
  styleUrl: './student-dashboard.css'
})
export class StudentDashboard implements OnInit {
  activePage = 'Dashboard';
  searchTerm = '';
  selectedEvent: StudentEvent | null = null;

  studentName = '';
  studentEmail = '';

  events: StudentEvent[] = [];
  registrations: Registration[] = [];

  loading = false;
  errorMessage = '';
  successMessage = '';
  registrationLoading = false;

  constructor(
    private router: Router,
    private eventService: EventService
  ) {}

  ngOnInit(): void {
    this.loadLoggedInUser();
  }

  // Get the actual logged-in student from sessionStorage
  private loadLoggedInUser(): void {
    const savedUser = sessionStorage.getItem('campusUser');

    if (!savedUser) {
      this.router.navigate(['/login']);
      return;
    }

    try {
      const user: LoggedInUser = JSON.parse(savedUser);

      if (
        !user.name ||
        !user.email ||
        user.role !== 'student'
      ) {
        sessionStorage.removeItem('campusUser');
        this.router.navigate(['/login']);
        return;
      }

      this.studentName = user.name;
      this.studentEmail = user.email.trim().toLowerCase();

      this.loadEvents();
    } catch {
      sessionStorage.removeItem('campusUser');
      this.router.navigate(['/login']);
    }
  }

  // Load events and registrations together from the backend
  loadEvents(): void {
    if (!this.studentEmail) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    forkJoin({
      events: this.eventService.getEvents(),
      registrations: this.eventService.getRegistrations(
        this.studentEmail
      )
    }).subscribe({
      next: ({ events: databaseEvents, registrations }) => {
        this.registrations = registrations;

        this.events = databaseEvents.map(event => {
          const registration = registrations.find(item => {
            const registeredEventId =
              typeof item.eventId === 'string'
                ? item.eventId
                : item.eventId?._id;

            return String(registeredEventId) === String(event._id);
          });

          return {
            ...event,
            icon: this.getEventIcon(event.category),
            color: this.getEventColor(event.category),
            registered: !!registration,
            registrationId: registration?._id
          };
        });

        // Update a selected event with the latest data
        if (this.selectedEvent?._id) {
          this.selectedEvent =
            this.events.find(
              event => event._id === this.selectedEvent?._id
            ) ?? null;
        }

        this.loading = false;
      },
      error: error => {
        console.error(
          'Failed to load events or registrations:',
          error
        );

        this.errorMessage =
          'Unable to load events or registrations. Please check that the backend is running.';

        this.loading = false;
      }
    });
  }

  loadRegistrations(): void {
    this.loadEvents();
  }

  getEventIcon(category: string): string {
    switch (category) {
      case 'Technical':
        return '💻';
      case 'Cultural':
        return '🎤';
      case 'Sports':
        return '🏸';
      case 'Workshop':
        return '🤖';
      default:
        return '🎉';
    }
  }

  getEventColor(category: string): string {
    switch (category) {
      case 'Technical':
        return 'technical';
      case 'Cultural':
        return 'cultural';
      case 'Sports':
        return 'sports';
      case 'Workshop':
        return 'workshop';
      default:
        return 'other';
    }
  }

  get filteredEvents(): StudentEvent[] {
    const term = this.searchTerm.trim().toLowerCase();

    return this.events.filter(event =>
      `${event.title} ${event.category} ${event.description}`
        .toLowerCase()
        .includes(term)
    );
  }

  get registeredEvents(): StudentEvent[] {
    return this.events.filter(event => event.registered);
  }

  // Count saved registrations rather than relying only on event cards
  get registrationCount(): number {
    return this.registrations.length;
  }

  // Upcoming events based on today's date
  get upcomingEvents(): StudentEvent[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.events.filter(event => {
      if (!event.date) {
        return false;
      }

      const eventDate = new Date(`${event.date}T00:00:00`);

      return !Number.isNaN(eventDate.getTime()) &&
        eventDate >= today;
    });
  }

  setPage(page: string): void {
    this.activePage = page;
    this.searchTerm = '';
    this.selectedEvent = null;
    this.successMessage = '';
    this.errorMessage = '';

    if (
      page === 'Dashboard' ||
      page === 'All Events' ||
      page === 'My Registrations'
    ) {
      this.loadEvents();
    }
  }

  viewEventDetails(event: StudentEvent): void {
    this.selectedEvent = event;
    this.activePage = 'Event Details';
    this.successMessage = '';
    this.errorMessage = '';
  }

  backToEvents(): void {
    this.selectedEvent = null;
    this.activePage = 'All Events';
  }

  // Save registration in MongoDB
  registerForEvent(event: StudentEvent): void {
    if (
      event.registered ||
      !event._id ||
      this.registrationLoading
    ) {
      return;
    }

    this.registrationLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.eventService
      .registerForEvent(this.studentEmail, event._id)
      .subscribe({
        next: () => {
          this.successMessage =
            'You have successfully registered for this event!';

          this.registrationLoading = false;
          this.loadEvents();
        },
        error: error => {
          console.error('Registration failed:', error);

          this.errorMessage =
            error.error?.message ||
            'Registration failed. Please try again.';

          this.registrationLoading = false;
        }
      });
  }

  // Cancel registration in MongoDB
  cancelRegistration(event: StudentEvent): void {
    if (!event.registrationId || this.registrationLoading) {
      return;
    }

    this.registrationLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.eventService
      .cancelRegistration(event.registrationId)
      .subscribe({
        next: () => {
          this.successMessage =
            'Registration cancelled successfully.';

          this.registrationLoading = false;
          this.loadEvents();
        },
        error: error => {
          console.error('Cancellation failed:', error);

          this.errorMessage =
            error.error?.message ||
            'Unable to cancel registration.';

          this.registrationLoading = false;
        }
      });
  }

  logout(): void {
    sessionStorage.removeItem('campusUser');
    this.router.navigate(['/login']);
  }
}
