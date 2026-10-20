
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EventService, CampusEvent } from '../../services/event.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css'
})
export class AdminDashboard implements OnInit {
  activePage = 'Dashboard';
  searchTerm = '';

  events: CampusEvent[] = [];

  newEvent: CampusEvent = this.createEmptyEvent();
  editingEventId: string | null = null;

  showDeleteModal = false;
  eventToDelete: CampusEvent | null = null;

  loading = false;
  errorMessage = '';

  constructor(
    private router: Router,
    private eventService: EventService
  ) {}

  ngOnInit(): void {
    this.loadEvents();
  }

  get filteredEvents(): CampusEvent[] {
    const term = this.searchTerm.trim().toLowerCase();

    return this.events.filter(event =>
      `${event.title} ${event.category} ${event.venue}`
        .toLowerCase()
        .includes(term)
    );
  }

  get technicalEvents(): number {
    return this.events.filter(
      event => event.category === 'Technical'
    ).length;
  }

  loadEvents(): void {
    this.loading = true;
    this.errorMessage = '';

    this.eventService.getEvents().subscribe({
      next: events => {
        this.events = events;
        this.loading = false;
      },
      error: error => {
        console.error('Failed to load events:', error);
        this.errorMessage = 'Could not load events. Check that the backend is running.';
        this.loading = false;
      }
    });
  }

  setPage(page: string): void {
    this.activePage = page;
    this.searchTerm = '';

    if (page === 'Create Event') {
      this.resetForm();
    }

    if (page === 'Dashboard' || page === 'Manage Events') {
      this.loadEvents();
    }
  }

  createEmptyEvent(): CampusEvent {
    return {
      title: '',
      category: 'Technical',
      description: '',
      date: '',
      time: '',
      venue: ''
    };
  }

  
saveEvent(): void {
  const title = this.newEvent.title?.trim();
  const description = this.newEvent.description?.trim();
  const venue = this.newEvent.venue?.trim();
  const date = this.newEvent.date;
  const time = this.newEvent.time;

  if (!title || !description || !venue || !date || !time) {
    this.errorMessage = 'Please fill in all event details.';
    return;
  }

  this.newEvent = {
    ...this.newEvent,
    title,
    description,
    venue,
    date,
    time
  };

  this.loading = true;
  this.errorMessage = '';

  const request = this.editingEventId
    ? this.eventService.updateEvent(
        this.editingEventId,
        this.newEvent
      )
    : this.eventService.createEvent(this.newEvent);

  request.subscribe({
    next: () => {
      this.resetForm();
      this.activePage = 'Manage Events';
      this.loadEvents();
    },
    error: error => {
      console.error('Failed to save event:', error);
      this.errorMessage =
        error.error?.message ||
        'Could not save the event. Please check the backend and try again.';
      this.loading = false;
    }
  });
}


  editEvent(event: CampusEvent): void {
    if (!event._id) {
      this.errorMessage = 'This event has no database ID. Please reload the events.';
      return;
    }

    this.newEvent = { ...event };
    this.editingEventId = event._id;
    this.activePage = 'Create Event';
  }

  deleteEvent(event: CampusEvent): void {
    this.eventToDelete = event;
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    if (!this.eventToDelete?._id) {
      this.cancelDelete();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.eventService.deleteEvent(this.eventToDelete._id).subscribe({
      next: () => {
        this.showDeleteModal = false;
        this.eventToDelete = null;
        this.loadEvents();
      },
      error: error => {
        console.error('Failed to delete event:', error);
        this.errorMessage = 'Could not delete the event. Please try again.';
        this.loading = false;
        this.cancelDelete();
      }
    });
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.eventToDelete = null;
  }

  resetForm(): void {
    this.newEvent = this.createEmptyEvent();
    this.editingEventId = null;
  }

  logout(): void {
    this.router.navigate(['/']);
  }
}
