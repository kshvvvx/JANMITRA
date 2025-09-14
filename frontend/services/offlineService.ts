import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from './api';
import { Complaint, DraftComplaint, toApiComplaint, toAppComplaint } from '../types/complaint';

const DRAFT_PREFIX = '@draft_';
const QUEUE_PREFIX = '@sync_queue_';

class OfflineService {
  private isConnected: boolean = true;
  private queue: (() => Promise<void>)[] = [];
  private isProcessingQueue: boolean = false;

  constructor() {
    this.initializeNetworkListener();
  }

  private async initializeNetworkListener() {
    // Check initial network state
    const state = await NetInfo.fetch();
    this.isConnected = state.isConnected ?? false;

    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener((networkState) => {
      const wasConnected = this.isConnected;
      this.isConnected = networkState.isConnected ?? false;
      
      // If we just came back online, process the queue
      if (!wasConnected && this.isConnected) {
        this.processQueue();
      }
    });

    // Cleanup on unmount if needed
    return unsubscribe;
  }

  // Save a draft complaint
  async saveDraft(complaint: Omit<DraftComplaint, 'id' | 'updatedAt' | 'isDraft'> & { id?: string }): Promise<string> {
    try {
      const draftId = complaint.id || `draft_${Date.now()}`;
      await AsyncStorage.setItem(
        `${DRAFT_PREFIX}${draftId}`,
        JSON.stringify({
          ...complaint,
          id: draftId,
          updatedAt: new Date().toISOString(),
          isDraft: true,
        })
      );
      return draftId;
    } catch (error) {
      console.error('Error saving draft:', error);
      throw error;
    }
  }

  // Get all saved drafts
  async getDrafts(): Promise<DraftComplaint[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const draftKeys = keys.filter(key => key.startsWith(DRAFT_PREFIX));
      const draftItems = await AsyncStorage.multiGet(draftKeys);
      
      return draftItems
        .map(([, value]) => (value ? JSON.parse(value) : null))
        .filter(Boolean) as Array<DraftComplaint>;
    } catch (error) {
      console.error('Error fetching drafts:', error);
      return [];
    }
  }

  // Delete a draft
  async deleteDraft(draftId: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${DRAFT_PREFIX}${draftId}`);
    } catch (error) {
      console.error('Error deleting draft:', error);
      throw error;
    }
  }

  // Add a request to the sync queue
  private async addToQueue(operation: () => Promise<any>): Promise<void> {
    const queueId = `${QUEUE_PREFIX}${Date.now()}`;
    await AsyncStorage.setItem(queueId, JSON.stringify(operation.toString()));
    this.queue.push(operation);
    
    if (this.isConnected) {
      this.processQueue();
    }
  }

  // Process all queued operations
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || !this.isConnected || this.queue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      while (this.queue.length > 0 && this.isConnected) {
        const operation = this.queue.shift();
        if (operation) {
          try {
            await operation();
            // Remove the corresponding item from AsyncStorage
            const keys = await AsyncStorage.getAllKeys();
            const queueKeys = keys.filter(key => key.startsWith(QUEUE_PREFIX));
            if (queueKeys.length > 0) {
              await AsyncStorage.multiRemove(queueKeys);
            }
          } catch (error) {
            console.error('Error processing queue operation:', error);
            // Continue with next operation even if one fails
            continue;
          }
        }
      }
    } catch (error) {
      console.error('Error in processQueue:', error);
    } finally {
      this.isProcessingQueue = false;
    }
  }


  // Submit a complaint with offline support
  async submitComplaint(complaint: Omit<Complaint, 'id' | 'createdAt' | 'status'>): Promise<Complaint> {
    const apiComplaint = toApiComplaint(complaint);
    
    // Create a temporary complaint object for the response
    const now = new Date().toISOString();
    const tempComplaint: Complaint = {
      ...complaint,
      id: `temp_${Date.now()}`,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      upvotes: 0,
      confirmations: 0,
    };

    if (this.isConnected) {
      try {
        const response = await apiService.submitComplaint(apiComplaint);
        // Convert the API response to our app's complaint format
        return toAppComplaint(response);
      } catch (error) {
        // If submission fails, save as draft and add to queue
        const draftId = await this.saveDraft({
          ...complaint,
          isDraft: true,
          localId: `draft_${Date.now()}`,
          lastSaved: new Date().toISOString(),
        });
        this.addToQueue(() => this.retrySubmit(apiComplaint, draftId));
        throw new Error('Failed to submit complaint. Saved as draft for later submission.');
      }
    } else {
      // If offline, save as draft and add to queue
      const draftId = await this.saveDraft({
        ...complaint,
        isDraft: true,
        localId: `draft_${Date.now()}`,
        lastSaved: new Date().toISOString(),
      });
      this.addToQueue(() => this.retrySubmit(apiComplaint, draftId));
      throw new Error('No internet connection. Complaint saved as draft.');
    }
  }

  // Retry submitting a failed complaint
  private async retrySubmit(
    complaint: CreateComplaintRequest,
    draftId: string
  ): Promise<void> {
    try {
      await apiService.submitComplaint(complaint);
      await this.deleteDraft(draftId);
    } catch (error) {
      console.error('Failed to submit complaint:', error);
      throw error;
    }
  }

  // Check if we're online
  isOnline(): boolean {
    return this.isConnected;
  }
}

export const offlineService = new OfflineService();
