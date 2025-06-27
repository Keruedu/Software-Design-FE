import { TimelineItem, Track } from '@/types/timeline';

export class AudioManager {
  private audioElements: Map<string, HTMLAudioElement> = new Map();
  private currentTime: number = 0;
  private isPlaying: boolean = false;
  private audioContext: AudioContext | null = null;
  private gainNodes: Map<string, GainNode> = new Map();
  private mutedTracks: Set<string> = new Set();

  constructor() {
    this.initializeAudioContext();
  }

  private initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Web Audio API not supported', error);
    }
  }

  async loadAudioItem(item: TimelineItem) {
    if (item.type !== 'audio' || !item.url) return;

    const audio = new Audio();
    audio.src = item.url;
    audio.preload = 'auto';
    audio.volume = (item.volume || 1) * 0.5; // Reduce volume to prevent clipping
    audio.loop = false;

    // Wait for audio to be loaded
    return new Promise<void>((resolve, reject) => {
      audio.addEventListener('canplaythrough', () => {
        this.audioElements.set(item.id, audio);
        resolve();
      });
      audio.addEventListener('error', reject);
    });
  }

  unloadAudioItem(itemId: string) {
    const audio = this.audioElements.get(itemId);
    if (audio) {
      audio.pause();
      audio.src = '';
      this.audioElements.delete(itemId);
    }
  }

  updateAudioItems(audioItems: TimelineItem[]) {
    // Remove audio elements that are no longer in the timeline
    const currentIds = new Set(audioItems.map(item => item.id));
    for (const [id, audio] of this.audioElements) {
      if (!currentIds.has(id)) {
        this.unloadAudioItem(id);
      }
    }

    // Load new audio items
    audioItems.forEach(item => {
      if (item.type === 'audio' && !this.audioElements.has(item.id)) {
        this.loadAudioItem(item).catch(error => {
          console.error('Failed to load audio item:', error);
        });
      }
    });
  }

  play(currentTime: number, audioItems: TimelineItem[], tracks: Track[] = []) {
    this.isPlaying = true;
    this.currentTime = currentTime;

    audioItems.forEach(item => {
      if (item.type !== 'audio') return;

      const audio = this.audioElements.get(item.id);
      if (!audio) return;

      // Check if the track this item belongs to is muted
      const track = tracks.find(t => t.items.some(i => i.id === item.id));
      const isTrackMuted = track ? this.mutedTracks.has(track.id) : false;

      const itemStartTime = item.startTime;
      const itemEndTime = item.startTime + item.duration;

      // Check if current time is within this audio item's range
      if (currentTime >= itemStartTime && currentTime < itemEndTime) {
        const audioTime = currentTime - itemStartTime;
        
        // Set audio currentTime and play
        if (Math.abs(audio.currentTime - audioTime) > 0.1) {
          audio.currentTime = audioTime;
        }
        
        // Set volume based on track mute status
        audio.volume = isTrackMuted ? 0 : (item.volume || 1) * 0.5;
        
        if (audio.paused) {
          audio.play().catch(error => {
            console.error('Failed to play audio:', error);
          });
        }
      } else {
        // Audio should not be playing at this time
        if (!audio.paused) {
          audio.pause();
        }
      }
    });
  }

  pause() {
    this.isPlaying = false;
    this.audioElements.forEach(audio => {
      if (!audio.paused) {
        audio.pause();
      }
    });
  }

  seekTo(time: number, audioItems: TimelineItem[], tracks: Track[] = []) {
    this.currentTime = time;
    
    audioItems.forEach(item => {
      if (item.type !== 'audio') return;

      const audio = this.audioElements.get(item.id);
      if (!audio) return;

      // Check if the track this item belongs to is muted
      const track = tracks.find(t => t.items.some(i => i.id === item.id));
      const isTrackMuted = track ? this.mutedTracks.has(track.id) : false;

      const itemStartTime = item.startTime;
      const itemEndTime = item.startTime + item.duration;

      if (time >= itemStartTime && time < itemEndTime) {
        const audioTime = time - itemStartTime;
        audio.currentTime = audioTime;
        
        // Set volume based on track mute status
        audio.volume = isTrackMuted ? 0 : (item.volume || 1) * 0.5;
        
        if (this.isPlaying) {
          audio.play().catch(error => {
            console.error('Failed to play audio after seek:', error);
          });
        }
      } else {
        audio.pause();
      }
    });
  }

  muteTrack(trackId: string) {
    this.mutedTracks.add(trackId);
    // Immediately update volumes for all audio in this track
    this.updateTrackAudioVolumes(trackId);
  }

  unmuteTrack(trackId: string) {
    this.mutedTracks.delete(trackId);
    // Immediately update volumes for all audio in this track
    this.updateTrackAudioVolumes(trackId);
  }

  isTrackMuted(trackId: string): boolean {
    return this.mutedTracks.has(trackId);
  }

  private updateTrackAudioVolumes(trackId: string) {
    // This method will be called from the component with proper track info
    // For now, we'll update volumes during the next play() call
  }

  // Method to update all audio volumes with track information
  updateAllAudioVolumes(audioItems: TimelineItem[], tracks: Track[]) {
    audioItems.forEach(item => {
      if (item.type !== 'audio') return;
      
      const audio = this.audioElements.get(item.id);
      if (!audio) return;
      
      const track = tracks.find(t => t.items.some((i: TimelineItem) => i.id === item.id));
      const isTrackMuted = track ? this.mutedTracks.has(track.id) : false;
      
      // Update volume immediately
      audio.volume = isTrackMuted ? 0 : (item.volume || 1) * 0.5;
    });
  }

  setVolume(itemId: string, volume: number) {
    const audio = this.audioElements.get(itemId);
    if (audio) {
      audio.volume = Math.max(0, Math.min(1, volume * 0.5)); // Limit volume to prevent clipping
    }
  }

  dispose() {
    this.audioElements.forEach(audio => {
      audio.pause();
      audio.src = '';
    });
    this.audioElements.clear();
    
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}

// Singleton instance
export const audioManager = new AudioManager();
