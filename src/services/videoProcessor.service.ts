import { ffmpegService,FFmpegService } from "./editVideo.service";

export interface VideoProcessingStep{
  id: string;
  type: 'trim' | 'addAudio' | 'adjustVolume' | 'replaceAudio';
  params: any;
  timestamp: number;
}

export interface ProcessedVideo{
  blob: Blob;
  url: string;
  duration: number;
  steps: VideoProcessingStep[];
  originalBlob?: Blob;
  originalUrl?: string;
}



export class VideoProcessor {
    private static instance: VideoProcessor;
    private currentVideo: ProcessedVideo | null = null;
    private ffmpegService: FFmpegService;
    private constructor() {
        this.ffmpegService = FFmpegService.getInstance();
    }
    static getInstance(): VideoProcessor {
        if (!VideoProcessor.instance) {
        VideoProcessor.instance = new VideoProcessor();
        }
        return VideoProcessor.instance;
    }

    async initialize(videoFile:File|string):Promise<ProcessedVideo> {
        await this.ffmpegService.initialize();
        let videoBlob: Blob;
        let duration: number;
        if (videoFile instanceof File) {
            videoBlob = videoFile;
        }
        else{
            const response = await fetch(videoFile);
            videoBlob = await response.blob();
        }
        duration = await this.getVideoDuration(videoBlob);
        this.currentVideo={
            blob: videoBlob,
            url: URL.createObjectURL(videoBlob),
            duration: duration,
            steps: [],
            originalBlob: videoBlob,
            originalUrl: URL.createObjectURL(videoBlob)
        }
        return this.currentVideo;
    }

    private async getVideoDuration(videoSource: File | Blob): Promise<number> {
        return new Promise((resolve) => {
        const video = document.createElement('video');
        const url = URL.createObjectURL(videoSource);
        
        video.onloadedmetadata = () => {
            resolve(video.duration);
            URL.revokeObjectURL(url);
        };
        
        video.src = url;
        });
   }
    async addProcessingStep(step: Omit<VideoProcessingStep,'id' |'timestamp'>): Promise<ProcessedVideo> {
        if (!this.currentVideo) {
            throw new Error('No video initialized. Call initialize() first.');
        }
        const newStep: VideoProcessingStep = {
            ...step,
            id: crypto.randomUUID(),
            timestamp: Date.now()
        };
        let resultBlob: Blob;
        try{
            switch(step.type) {
                case 'trim':
                    console.log('VideoProcessor - Executing trim step:', {
                        startTime: step.params.startTime,
                        endTime: step.params.endTime,
                        duration: step.params.endTime - step.params.startTime,
                        originalDuration: this.currentVideo.duration
                    });
                    
                    resultBlob = await this.ffmpegService.trimVideo(
                        this.currentVideo.blob,
                        step.params.startTime,
                        step.params.endTime
                    )
                    this.currentVideo.duration = step.params.endTime - step.params.startTime;
                    console.log('VideoProcessor - Trim completed, new duration:', this.currentVideo.duration);
                    break;
                case 'addAudio':
                    resultBlob =await this.ffmpegService.addAudioToVideo(
                        this.currentVideo.blob,
                        step.params.audioFile,
                        step.params.options
                    )
                    break;
                case 'adjustVolume':
                    // Temporarily skip volume adjustment as it is not implemented yet
                    resultBlob = this.currentVideo.blob;
                    break;
                case 'replaceAudio':
                    resultBlob = await this.ffmpegService.addAudioToVideo(
                        this.currentVideo.blob,
                        step.params.audioFile,
                        {...step.params.options, replaceOriginalAudio: true }
                    )
                    break;
                default:
                    throw new Error(`Unsupported step type: ${step.type}`);
            }
            URL.revokeObjectURL(this.currentVideo.url);
            this.currentVideo ={
                blob: resultBlob,
                url: URL.createObjectURL(resultBlob),
                duration: this.currentVideo.duration,
                steps: [...this.currentVideo.steps, newStep],
                originalBlob: this.currentVideo.originalBlob,
                originalUrl: this.currentVideo.originalUrl
            }
            return this.currentVideo; 
        }
        catch (error) {
            console.error('Error processing video step:', error);
            throw new Error('Failed to process video step');
        }

    }
    
    private async reprocessFromSteps(steps: VideoProcessingStep[]): Promise<void> {
        if (!this.currentVideo?.originalBlob) return;

        // Clean up current URL
        URL.revokeObjectURL(this.currentVideo.url);

        // Reset to original video
        let currentBlob = this.currentVideo.originalBlob;
        let currentDuration = await this.getVideoDuration(this.currentVideo.originalBlob);

        // Reapply each step
        for (const step of steps) {
            try {
                switch (step.type) {
                    case 'trim':
                        currentBlob = await this.ffmpegService.trimVideo(
                            currentBlob,
                            step.params.startTime,
                            step.params.endTime
                        );
                        currentDuration = step.params.endTime - step.params.startTime;
                        break;

                    case 'addAudio':
                        currentBlob = await this.ffmpegService.addAudioToVideo(
                            currentBlob,
                            step.params.audioFile,
                            step.params.options
                        );
                        break;

                    case 'adjustVolume':
                        // Temporarily skip volume adjustment as it is not implemented yet
                        break;

                    case 'replaceAudio':
                        currentBlob = await this.ffmpegService.addAudioToVideo(
                            currentBlob,
                            step.params.audioFile,
                            { ...step.params.options, replaceOriginalAudio: true }
                        );
                        break;
                }
            } catch (error) {
                console.error('Error reprocessing step:', step, error);
                break;
            }
        }

        // Update current video
        this.currentVideo = {
            blob: currentBlob,
            url: URL.createObjectURL(currentBlob),
            duration: currentDuration,
            steps: steps,
            originalBlob: this.currentVideo.originalBlob,
            originalUrl: this.currentVideo.originalUrl
        };
    }
    async undoLastStep(): Promise<ProcessedVideo | null> {
        if (!this.currentVideo || this.currentVideo.steps.length === 0) {
            return null;
        }

        // Remove last step
        const stepsWithoutLast = this.currentVideo.steps.slice(0, -1);
        
        // Re-process from original video
        await this.reprocessFromSteps(stepsWithoutLast);
        
        return this.currentVideo;
    }
    getCurrentVideo(): ProcessedVideo | null {
        return this.currentVideo;
    }
    getProcessingHistory(): VideoProcessingStep[] {
        return this.currentVideo?.steps || [];
    }
    canUndo(): boolean {
        return this.currentVideo ? this.currentVideo.steps.length > 0 : false;  
    }
    // async undoLastStep():Promise<ProcessedVideo|null>{
    //     if (!this.currentVideo || this.currentVideo.steps.length === 0) {
    //         return null;
    //     }

    // }

    // private async reprocessFromStep
    downloadCurrentVideo(filename: string = 'processed-video.mp4'): void {
        if (!this.currentVideo) {
        throw new Error('No video to download');
        }

        this.ffmpegService.downloadFile(this.currentVideo.blob, filename);
    }
    cleanup(): void {
        if (this.currentVideo) {
        URL.revokeObjectURL(this.currentVideo.url);
        if (this.currentVideo.originalUrl) {
            URL.revokeObjectURL(this.currentVideo.originalUrl);
        }
        this.currentVideo = null;
        }
   
  }
}

export const videoProcessor = VideoProcessor.getInstance();