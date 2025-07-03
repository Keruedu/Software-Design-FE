import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";


export class FFmpegService{
    private static instance :FFmpegService;
    private ffmpeg: FFmpeg |null =null;
    private isLoaded = false;
    private constructor() {}

    static getInstance(): FFmpegService {
        if (!FFmpegService.instance) {
            FFmpegService.instance = new FFmpegService();
        }
        return FFmpegService.instance;
    }
    async initialize(): Promise<void> {
        if(this.isLoaded) {
            return;
        }
        this.ffmpeg = new FFmpeg();
        await this.ffmpeg.load();
        this.isLoaded = true;
    }


async hasAudioStream(videoFile: File | string | Blob): Promise<boolean> {
    if (!this.ffmpeg || !this.isLoaded) {
        throw new Error("FFmpeg is not initialized. Call initialize() first.");
    }
    try {
        let videoData: ArrayBuffer;
        if (videoFile instanceof File || videoFile instanceof Blob) {
            videoData = await videoFile.arrayBuffer();
        } else {
            const response = await fetch(videoFile);
            if (!response.ok) {
                throw new Error(`Failed to fetch video file: ${response.statusText}`);
            }
            videoData = await response.arrayBuffer();
        }

        const timestamp = Date.now();
        const inputVideoName = `probe_video_${timestamp}.mp4`;
        
        await this.ffmpeg.writeFile(inputVideoName, new Uint8Array(videoData));
        
        try {
            await this.ffmpeg.exec([
                '-i', inputVideoName,
                '-f', 'null',
                '-map', '0:a',
            ]);
            
            await this.ffmpeg.deleteFile(inputVideoName);
            return true;
            
        } catch (error) {
            await this.ffmpeg.deleteFile(inputVideoName);
            return false;
        }
        
    } catch (error) {
        console.error("Error checking audio stream:", error);
        return false;
    }
}
    async addAudioToVideo(
        videoFile:File|string|Blob,
        audioFile:File|Blob,
        options:{
            audioVolume?:number;
            audioStartTime?:number;
            replaceOriginalAudio?:boolean;
        } ={}
    ): Promise<Blob> {
        if(!this.ffmpeg || !this.isLoaded)
        {
            throw new Error("FFmpeg is not initialized. Call initialize() first.");
        }
        const {
        audioVolume = 0.5,
        audioStartTime = 0,
        replaceOriginalAudio = false} = options;
        console.log("Video ",videoFile)
        console.log('Audio',audioFile)
        const timestamp = Date.now();
        const inputVideoName = `input_video_${timestamp}.mp4`;
        const inputAudioName = `input_audio_${timestamp}.mp3`;
        const outputName = `output_${timestamp}.mp4`;
        try{
            let videoData:ArrayBuffer
            if(videoFile instanceof File || videoFile instanceof Blob){
                videoData = await videoFile.arrayBuffer();
            }
            else{
                const response = await fetch(videoFile);
                if (!response.ok) {
                    throw new Error(`Failed to fetch video file: ${response.statusText}`);
                }
                videoData = await response.arrayBuffer();
            }
            const audioData = await audioFile.arrayBuffer();
            await this.ffmpeg.writeFile(inputVideoName, new Uint8Array(videoData));
            await this.ffmpeg.writeFile(inputAudioName, new Uint8Array(audioData));
            const audioDelay = audioStartTime > 0
            ? `,adelay=${audioStartTime * 1000}|${audioStartTime * 1000}`
            : "";
            let filterComplex = "";
            if(replaceOriginalAudio)
            {
                filterComplex =`[1:a]volume=${audioVolume},aformat=sample_fmts=fltp:sample_rates=44100${audioDelay}[audio_processed]`;
            }
            else{
                const hasAudio = await this.hasAudioStream(videoFile);
                console.log()
                if(!hasAudio)
                {
                    filterComplex =`[1:a]volume=${audioVolume},aformat=sample_fmts=fltp:sample_rates=44100${audioDelay}[audio_processed]`;
                }
                else{
                    filterComplex = `
                        [0:a]aformat=sample_fmts=fltp:sample_rates=44100[a_orig];
                        [1:a]volume=${audioVolume},aformat=sample_fmts=fltp:sample_rates=44100${audioDelay}[a_new];
                        [a_orig][a_new]amix=inputs=2:duration=first[audio_processed]
                    `.replace(/\s+/g, " ");
                    }
                }
            const command = [
                "-i", inputVideoName,
                "-i", inputAudioName,
                "-filter_complex", filterComplex,
                "-map", "0:v",
                "-map", "[audio_processed]",
                "-c:v", "copy",
                "-c:a", "aac",
                outputName
                ];
            console.log("FFmpeg command:", command.join(" "));
            await this.ffmpeg.exec(command);
            const data = await this.ffmpeg.readFile(outputName);
            await this.ffmpeg.deleteFile(inputVideoName);
            await this.ffmpeg.deleteFile(inputAudioName);
            await this.ffmpeg.deleteFile(outputName);
            return new Blob([data], { type: 'video/mp4' });
        }
        catch (error) {
            console.error("Error adding audio to video:", error);
            throw new Error(`Failed to add audio to video: ${error instanceof Error ? error.message : String(error)}`);
        }

    }

    async trimVideo(
        videoFile: File | string | Blob,
        startTime: number,
        endTime: number
    ): Promise<Blob> {
        if (!this.ffmpeg || !this.isLoaded) {
            throw new Error("FFmpeg is not initialized. Call initialize() first.");
        }

        try {
            let videoData: ArrayBuffer;
            if (videoFile instanceof File || videoFile instanceof Blob) {
                videoData = await videoFile.arrayBuffer();
            } else {
                const response = await fetch(videoFile);
                if (!response.ok) {
                    throw new Error(`Failed to fetch video file: ${response.statusText}`);
                }
                videoData = await response.arrayBuffer();
            }

            const timestamp = Date.now();
            const inputVideoName = `input_video_${timestamp}.mp4`;
            const outputVideoName = `trimmed_video_${timestamp}.mp4`;

            // Write input video to ffmpeg filesystem
            await this.ffmpeg.writeFile(inputVideoName, new Uint8Array(videoData));

            console.log(`Trimming video from ${startTime}s to ${endTime}s (duration: ${endTime - startTime}s)`);

            // Build FFmpeg command
            const ffmpegCommand = [
                '-i', inputVideoName,
                '-ss', startTime.toString(),
                '-t', (endTime - startTime).toString(), // Sử dụng -t thay vì -to
                '-c:v', 'libx264', // Re-encode video để đảm bảo trim chính xác
                '-c:a', 'aac',     // Re-encode audio
                '-preset', 'fast', // Tăng tốc encode
                '-avoid_negative_ts', 'make_zero',
                outputVideoName
            ];

            console.log('FFmpeg trim command:', ffmpegCommand.join(' '));

            // Execute trim command - re-encode để đảm bảo trim chính xác
            await this.ffmpeg.exec(ffmpegCommand);

            console.log('FFmpeg trim command completed successfully');

            // Read the output video
            const data = await this.ffmpeg.readFile(outputVideoName);
            
            console.log(`Trimmed video size: ${data.length} bytes`);

            // Create result blob
            const resultBlob = new Blob([data], { type: 'video/mp4' });
            console.log(`Trim completed - output blob size: ${resultBlob.size} bytes`);
            
            // Check actual duration of trimmed video
            const actualDuration = await this.getVideoDuration(resultBlob);
            console.log(`Actual trimmed video duration: ${actualDuration}s (expected: ${endTime - startTime}s)`);
            
            // Cleanup files
            await this.ffmpeg.deleteFile(inputVideoName);
            await this.ffmpeg.deleteFile(outputVideoName);
            
            return resultBlob;
        } catch (error) {
            console.error("Error trimming video:", error);
            throw new Error(`Failed to trim video: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async trimAudio(
        audioFile: File | string | Blob,
        startTime: number,
        endTime: number
    ) : Promise<Blob> {
        if (!this.ffmpeg || !this.isLoaded) {
            throw new Error("FFmpeg is not initialized. Call initialize() first.");
        }
        try{
            let audioData: ArrayBuffer;
            if (audioFile instanceof File || audioFile instanceof Blob) {
                audioData = await audioFile.arrayBuffer();
            } else {
                const response = await fetch(audioFile);
                if (!response.ok) {
                    throw new Error(`Failed to fetch audio file: ${response.statusText}`);
                }
                audioData = await response.arrayBuffer();
            }
            const timestamp = Date.now();
            const inputAudioName = `input_audio_${timestamp}.mp3`;
            const outputName = `output_${timestamp}.mp3`;
            await this.ffmpeg.writeFile(inputAudioName, new Uint8Array(audioData));
            await this.ffmpeg.exec([
                '-i', inputAudioName,
                '-ss', startTime.toString(),
                '-to', endTime.toString(),
                '-c', 'copy',
                outputName
            ]);
            const data = await this.ffmpeg.readFile(outputName);
            await this.ffmpeg.deleteFile(inputAudioName);
            await this.ffmpeg.deleteFile(outputName);
            return new Blob([data], { type: 'audio/mp3' });
        }
        catch (error) {
            console.error("Error trimming audio:", error);
            throw new Error(`Failed to trim audio: ${error instanceof Error ? error.message : String(error)}`);
        }

    }


    downloadFile(blob:Blob,filename:string):void{
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
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

    async addTextOverlay(
        videoFile: File | string | Blob,
        textOverlayParams: {
            text: string;
            position: { x: number; y: number };
            style: {
                fontSize: number;
                fontFamily: string;
                color: string;
                fontWeight: string;
                fontStyle: string;
                textAlign: string;
            };
            timing: {
                startTime: number;
                duration: number;
            };
            size?: { width: number; height: number };
            opacity?: number;
            shadow?: {
                enabled: boolean;
                color: string;
                blur: number;
                offsetX: number;
                offsetY: number;
            };
            outline?: {
                enabled: boolean;
                color: string;
                width: number;
            };
            background?: {
                enabled: boolean;
                color: string;
                opacity: number;
                borderRadius: number;
                padding: number;
            };
        }
    ): Promise<Blob> {
        if (!this.ffmpeg || !this.isLoaded) {
            throw new Error("FFmpeg is not initialized. Call initialize() first.");
        }

        try {
            let videoData: ArrayBuffer;
            if (videoFile instanceof File || videoFile instanceof Blob) {
                videoData = await videoFile.arrayBuffer();
            } else {
                const response = await fetch(videoFile);
                if (!response.ok) {
                    throw new Error(`Failed to fetch video file: ${response.statusText}`);
                }
                videoData = await response.arrayBuffer();
            }

            const timestamp = Date.now();
            const inputVideoName = `input_video_${timestamp}.mp4`;
            const outputName = `output_${timestamp}.mp4`;

            await this.ffmpeg.writeFile(inputVideoName, new Uint8Array(videoData));

            // Build FFmpeg text filter string
            const textFilter = this.buildTextFilter(textOverlayParams);
            
            console.log('FFmpeg text filter:', textFilter);

            // Execute FFmpeg command with text overlay
            await this.ffmpeg.exec([
                '-i', inputVideoName,
                '-vf', textFilter,
                '-c:a', 'copy',
                '-c:v', 'libx264',
                '-preset', 'fast',
                '-crf', '23',
                outputName
            ]);

            const data = await this.ffmpeg.readFile(outputName);
            const resultBlob = new Blob([data], { type: 'video/mp4' });

            // Cleanup files
            await this.ffmpeg.deleteFile(inputVideoName);
            await this.ffmpeg.deleteFile(outputName);

            return resultBlob;
        } catch (error) {
            console.error("Error adding text overlay:", error);
            throw new Error(`Failed to add text overlay: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    private buildTextFilter(params: any): string {
        const {
            text,
            position,
            style,
            timing,
            size,
            opacity = 1,
            shadow,
            outline,
            background,
        } = params;

        // Escape text for FFmpeg
        const escapedText = text.replace(/'/g, "\\'").replace(/:/g, "\\:");
        
        // Convert percentage position to pixels (assuming 1920x1080 reference)
        const x = Math.round((position.x / 100) * 1920);
        const y = Math.round((position.y / 100) * 1080);

        // Build base text filter
        let textFilter = `drawtext=text='${escapedText}'`;
        
        // Position
        textFilter += `:x=${x}:y=${y}`;
        
        // Font settings
        textFilter += `:fontsize=${style.fontSize}`;
        textFilter += `:fontcolor=${style.color}`;
        
        // Font family (FFmpeg uses different font names)
        const fontFamily = this.mapFontFamily(style.fontFamily);
        if (fontFamily) {
            textFilter += `:fontfile=${fontFamily}`;
        }
        
        // Font weight and style
        if (style.fontWeight === 'bold') {
            textFilter += `:font_weight=bold`;
        }
        if (style.fontStyle === 'italic') {
            textFilter += `:font_style=italic`;
        }
        
        // Timing
        if (timing.startTime > 0) {
            textFilter += `:enable='between(t,${timing.startTime},${timing.startTime + timing.duration})'`;
        } else {
            textFilter += `:enable='between(t,0,${timing.duration})'`;
        }
        
        // Opacity
        if (opacity < 1) {
            const alpha = Math.round(opacity * 255).toString(16).padStart(2, '0');
            textFilter += `:alpha=${alpha}`;
        }
        
        // Shadow
        if (shadow?.enabled) {
            textFilter += `:shadowcolor=${shadow.color}`;
            textFilter += `:shadowx=${shadow.offsetX}`;
            textFilter += `:shadowy=${shadow.offsetY}`;
        }
        
        // Outline
        if (outline?.enabled) {
            textFilter += `:bordercolor=${outline.color}`;
            textFilter += `:borderw=${outline.width}`;
        }
        
        // Box background
        if (background?.enabled) {
            textFilter += `:box=1`;
            textFilter += `:boxcolor=${background.color}`;
            if (background.opacity < 1) {
                const bgAlpha = Math.round(background.opacity * 255).toString(16).padStart(2, '0');
                textFilter += `:boxalpha=${bgAlpha}`;
            }
            if (background.padding) {
                textFilter += `:boxborderw=${background.padding}`;
            }
        }
        
        return textFilter;
    }

    private mapFontFamily(fontFamily: string): string | null {
        // Map web font names to system font paths
        // This is a simplified mapping - in production, you'd want to include actual font files
        const fontMap: { [key: string]: string } = {
            'Arial': 'arial.ttf',
            'Helvetica': 'helvetica.ttf',
            'Times New Roman': 'times.ttf',
            'Georgia': 'georgia.ttf',
            'Verdana': 'verdana.ttf',
            'Courier New': 'courier.ttf',
            'Arial Black': 'arialbd.ttf',
            'Comic Sans MS': 'comic.ttf',
            'Impact': 'impact.ttf',
            'Trebuchet MS': 'trebuc.ttf',
            'Tahoma': 'tahoma.ttf',
        };
        
        return fontMap[fontFamily] || null;
    }
}
export const ffmpegService = FFmpegService.getInstance();