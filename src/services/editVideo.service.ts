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
            duration?:number; // Thêm tham số duration để trim audio theo duration
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
        duration: audioDuration, // Sử dụng duration từ options, alias thành audioDuration
        replaceOriginalAudio = false} = options;
        
        console.log("🎵 Adding audio to video:", {
            audioVolume,
            audioStartTime,
            audioDuration: audioDuration ? `${audioDuration}s` : 'full duration',
            replaceOriginalAudio
        });
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
            
            // Thêm trim audio nếu có audioDuration (trim trước, sau đó mới áp volume và delay)
            const audioTrim = audioDuration 
            ? `atrim=duration=${audioDuration},`
            : "";
            
            let filterComplex = "";
            if(replaceOriginalAudio)
            {
                filterComplex =`[1:a]${audioTrim}volume=${audioVolume},aformat=sample_fmts=fltp:sample_rates=44100${audioDelay}[audio_processed]`;
            }
            else{
                const hasAudio = await this.hasAudioStream(videoFile);
                console.log()
                if(!hasAudio)
                {
                    filterComplex =`[1:a]${audioTrim}volume=${audioVolume},aformat=sample_fmts=fltp:sample_rates=44100${audioDelay}[audio_processed]`;
                }
                else{
                    filterComplex = `
                        [0:a]aformat=sample_fmts=fltp:sample_rates=44100[a_orig];
                        [1:a]${audioTrim}volume=${audioVolume},aformat=sample_fmts=fltp:sample_rates=44100${audioDelay}[a_new];
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

    async addMultipleTextOverlays(
        videoFile: File | string | Blob,
        textOverlayParams: Array<{
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
        }>,
        videoSize: { width: number; height: number }
    ): Promise<Blob> {
        if (!this.ffmpeg || !this.isLoaded) {
            throw new Error("FFmpeg is not initialized. Call initialize() first.");
        }

        console.log("📝 Adding multiple text overlays:", {
            overlayCount: textOverlayParams.length,
            videoSize,
            overlays: textOverlayParams.map((p, i) => ({
                index: i,
                text: p.text,
                timing: p.timing,
                position: p.position,
                style: p.style
            }))
        });

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
             const fontsUsed = new Set<string>();
            await this.ffmpeg.writeFile(inputVideoName, new Uint8Array(videoData));
            const filterResults = textOverlayParams.map((params) => {
            const { textFilter, font } = this.buildTextFilter(params, videoSize);
            if (font) fontsUsed.add(font); 
            return textFilter;
            });
            const textFilters = filterResults.join(',');
            console.log("Text filters:", textFilters);
            console.log("Fonts used:", Array.from(fontsUsed));
            
            // Load fonts and handle loading errors gracefully
            try {
                await Promise.all(Array.from(fontsUsed).map(async (font) => {
                    if (!this.ffmpeg) return;
                    console.log(`📄 Loading font: ${font}`);
                    try {
                        const fontResponse = await fetch(`/fonts/${font}`);
                        if (!fontResponse.ok) {
                            console.warn(`Font ${font} not found, using fallback font`);
                            return;
                        }
                        const fontBuffer = await fontResponse.arrayBuffer();
                        await this.ffmpeg.writeFile(`${font}`, new Uint8Array(fontBuffer));
                        console.log(`✅ Font loaded: ${font}`);
                    } catch (fontError) {
                        console.warn(`Failed to load font ${font}:`, fontError);
                        // Continue without font - FFmpeg will use default
                    }
                }));
            } catch (fontLoadError) {
                console.warn('Font loading failed, continuing with default fonts:', fontLoadError);
            }

            const ffmpegCommand = [
            "-i", inputVideoName,
            "-vf", textFilters,
            "-c:a", "copy",
            outputName
            ];
            console.log("FFmpeg text overlay command:", ffmpegCommand.join(" "));
            
            try {
                await this.ffmpeg.exec(ffmpegCommand);
                console.log("✅ Text overlay FFmpeg command completed successfully");
            } catch (ffmpegError) {
                console.error("❌ FFmpeg text overlay command failed:", ffmpegError);
                throw new Error(`FFmpeg text overlay failed: ${ffmpegError}`);
            }
            const data = await this.ffmpeg.readFile(outputName);
            const resultBlob = new Blob([data], { type: 'video/mp4' });
            // Cleanup files
            await this.ffmpeg.deleteFile(inputVideoName);
            await this.ffmpeg.deleteFile(outputName);
            
            // Cleanup fonts
            try {
                await Promise.all(Array.from(fontsUsed).map(async (font) => {
                    if (!this.ffmpeg) return;
                    try {
                        await this.ffmpeg.deleteFile(font);
                        console.log(`🗑️ Font cleaned up: ${font}`);
                    } catch (deleteError) {
                        console.warn(`Failed to delete font ${font}:`, deleteError);
                    }
                }));
            } catch (cleanupError) {
                console.warn('Font cleanup failed:', cleanupError);
            }

            return resultBlob;
        } catch (error) {
            console.error("Error adding multiple text overlays:", error);
            throw new Error(`Failed to add multiple text overlays: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    private buildTextFilter(params: any, videoSize: {width:number,height:number}): { textFilter: string, font: string } {
        const {
            text,
            position,
            style,
            timing,
            opacity = 1,
        } = params;
        
        console.log("🎯 Building text filter for:", {
            text: text.substring(0, 20) + (text.length > 20 ? '...' : ''),
            position,
            style,
            timing,
            opacity,
            videoSize
        });
        
        let font='';
        const escapedText = text.replace(/'/g, "\\'").replace(/:/g, "\\:");
        console.log("Debug timing", timing)
        const x = Math.round(Math.min(Math.max(((position.x - 14)  / 100),0 ),1) * videoSize.width);
        const y = Math.round(Math.min(Math.max(((position.y + 8)  / 100),0 ),1)* videoSize.height);
        
        console.log("📍 Text position calculated:", { x, y, originalPosition: position });
        
        let textFilter = `drawtext=text='${escapedText}'`;
        textFilter += `:x=${x}:y=${y}`;
        textFilter += `:fontsize=${style.fontSize}`;
        
        if (opacity < 1) {
            const alphaHex = Math.round(opacity * 255).toString(16).padStart(2, '0').toUpperCase();
            textFilter += `:fontcolor=${style.color}${alphaHex}`;
        }
        else {
           textFilter += `:fontcolor=${style.color}`;
        }
        if (style.fontFamily) {
            const fontPath = this.mapFontFamily(style.fontFamily);
            if (fontPath) {
                textFilter += `:fontfile=/${fontPath}`;
                font += fontPath;
                if(style.fontWeight=== 'bold') {
                    textFilter += "-Bold";
                    font += "-Bold";
                }
                if(style.fontStyle === 'italic') {
                    textFilter += "-Italic";
                    font += "-Italic";
                }
                if(style.fontWeight!== 'bold' && style.fontStyle !== 'italic') {
                    textFilter += "-Regular";
                    font += "-Regular";
                }
                textFilter += `.ttf`;
                font+=`.ttf`;
            } else {
                textFilter += `:fontfile=/Roboto-Regular.ttf`;
                font = 'Roboto-Regular.ttf';
            }
        } else {
            // Fallback font
            textFilter += `:fontfile=/Roboto-Regular.ttf`;
            font = 'Roboto-Regular.ttf';
        }

        if (timing.startTime > 0) {
            textFilter += `:enable='between(t,${timing.startTime},${timing.startTime + timing.duration})'`;
        } else {
            textFilter += `:enable='between(t,0,${timing.duration})'`;
        }
        
        console.log("📝 Generated text filter:", textFilter);
        console.log("📄 Font file:", font);
        
        return { textFilter, font };
    }

    /**
     * Nén video để giảm kích thước file
     */
    async compressVideo(
        videoFile: File | string | Blob,
        bitrate: string = '800k', // Increase bitrate
        scale: string = '1280x720' // Increase resolution
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
            const outputVideoName = `compressed_video_${timestamp}.mp4`;

            // Write input video to ffmpeg filesystem
            await this.ffmpeg.writeFile(inputVideoName, new Uint8Array(videoData));

            console.log(`Nén video với bitrate: ${bitrate}, scale: ${scale}`);

            // Build FFmpeg command for high-quality compression
            const ffmpegCommand = [
                '-i', inputVideoName,
                '-vf', `scale=${scale}`,
                '-c:v', 'libx264',
                '-b:v', bitrate,
                '-maxrate', bitrate,
                '-bufsize', '2M', // Buffer size for better quality
                '-preset', 'medium', // Better quality preset
                '-profile:v', 'high', // High profile for better compression
                '-level:v', '4.0',
                '-c:a', 'aac',
                '-b:a', '128k', // Tăng audio bitrate để giữ chất lượng
                '-ar', '44100', // Standard audio sample rate
                '-movflags', '+faststart',
                '-avoid_negative_ts', 'make_zero',
                '-pix_fmt', 'yuv420p', // Ensure compatibility
                outputVideoName
            ];

            console.log('FFmpeg compress command:', ffmpegCommand.join(' '));

            // Execute compression command
            await this.ffmpeg.exec(ffmpegCommand);

            // Read the compressed video file
            const compressedData = await this.ffmpeg.readFile(outputVideoName);

            // Clean up files
            await this.ffmpeg.deleteFile(inputVideoName);
            await this.ffmpeg.deleteFile(outputVideoName);

            const originalSizeMB = videoData.byteLength / (1024 * 1024);
            const compressedSizeMB = (compressedData as Uint8Array).byteLength / (1024 * 1024);
            console.log(`✅ Nén hoàn tất: ${originalSizeMB.toFixed(2)}MB → ${compressedSizeMB.toFixed(2)}MB`);
            
            return new Blob([compressedData], { type: 'video/mp4' });

        } catch (error) {
            console.error("❌ Lỗi khi nén video:", error);
            throw new Error(`Failed to compress video: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    private mapFontFamily(fontFamily: string): string | null {
        const fontMap: { [key: string]: string } = {
            'Roboto':'Roboto',
            'Open Sans':'OpenSans',
            'Lato':'Lato',
        };
        
        return fontMap[fontFamily] || null;
    }

    /**
     * Add multiple audio tracks to video at once
     * This method handles multiple audio files with different timings and volumes
     */
    async addMultipleAudioToVideo(
        videoFile: File | string | Blob,
        audioTracks: Array<{
            audioFile: File | Blob;
            startTime: number;
            duration?: number;
            volume: number;
        }>
    ): Promise<Blob> {
        if (!this.ffmpeg || !this.isLoaded) {
            throw new Error("FFmpeg is not initialized. Call initialize() first.");
        }

        if (audioTracks.length === 0) {
            throw new Error("No audio tracks provided");
        }

        console.log(`🎵 Adding ${audioTracks.length} audio tracks to video:`, 
            audioTracks.map((track, i) => ({
                index: i,
                startTime: track.startTime,
                duration: track.duration || 'full',
                volume: track.volume
            }))
        );

        // Sort audio tracks by start time for better processing
        const sortedAudioTracks = [...audioTracks].sort((a, b) => a.startTime - b.startTime);
        console.log("🎵 Sorted audio tracks by startTime:", sortedAudioTracks.map(t => t.startTime));

        const timestamp = Date.now();
        const inputVideoName = `input_video_${timestamp}.mp4`;
        const audioInputNames: string[] = [];
        const outputName = `output_${timestamp}.mp4`;

        try {
            // Prepare video data
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

            // Write video file
            await this.ffmpeg.writeFile(inputVideoName, new Uint8Array(videoData));

            // Write all audio files
            for (let i = 0; i < sortedAudioTracks.length; i++) {
                const audioInputName = `input_audio_${i}_${timestamp}.mp3`;
                audioInputNames.push(audioInputName);
                
                const audioData = await sortedAudioTracks[i].audioFile.arrayBuffer();
                await this.ffmpeg.writeFile(audioInputName, new Uint8Array(audioData));
            }

            // Check if video has original audio
            const hasOriginalAudio = await this.hasAudioStream(videoFile);
            
            // Build filter complex for multiple audio mixing
            let filterComplex = "";
            const audioInputs: string[] = [];
            
            // Process original audio if exists
            if (hasOriginalAudio) {
                filterComplex += "[0:a]aformat=sample_fmts=fltp:sample_rates=44100[a_orig];";
                audioInputs.push("[a_orig]");
            }

            // Process each new audio track
            for (let i = 0; i < sortedAudioTracks.length; i++) {
                const track = sortedAudioTracks[i];
                const audioIndex = i + 1; // Audio inputs start from index 1 (0 is video)
                
                // Build audio processing filter
                let audioFilter = `[${audioIndex}:a]`;
                
                // Add trim if duration is specified
                if (track.duration) {
                    audioFilter += `atrim=duration=${track.duration},`;
                }
                
                // Add volume
                audioFilter += `volume=${track.volume},`;
                
                // Add delay if startTime > 0
                if (track.startTime > 0) {
                    audioFilter += `adelay=${track.startTime * 1000}|${track.startTime * 1000},`;
                }
                
                // Add format
                audioFilter += `aformat=sample_fmts=fltp:sample_rates=44100[a_new_${i}];`;
                
                filterComplex += audioFilter;
                audioInputs.push(`[a_new_${i}]`);
            }

            // Mix all audio inputs
            if (audioInputs.length > 1) {
                filterComplex += `${audioInputs.join('')}amix=inputs=${audioInputs.length}:duration=longest:dropout_transition=2[audio_processed]`;
            } else {
                // Only one audio input, just rename it
                filterComplex += `${audioInputs[0]}aformat=sample_fmts=fltp:sample_rates=44100[audio_processed]`;
            }

            console.log("🎵 Multiple audio filter complex:", filterComplex);
            console.log("🎵 Audio inputs:", audioInputs);

            // Build FFmpeg command
            const command = [
                "-i", inputVideoName,
                ...audioInputNames.map(name => ["-i", name]).flat(),
                "-filter_complex", filterComplex,
                "-map", "0:v",
                "-map", "[audio_processed]",
                "-c:v", "copy",
                "-c:a", "aac",
                outputName
            ];

            console.log("FFmpeg multiple audio command:", command.join(" "));
            await this.ffmpeg.exec(command);

            const data = await this.ffmpeg.readFile(outputName);

            // Cleanup files
            await this.ffmpeg.deleteFile(inputVideoName);
            for (const audioInputName of audioInputNames) {
                await this.ffmpeg.deleteFile(audioInputName);
            }
            await this.ffmpeg.deleteFile(outputName);

            return new Blob([data], { type: 'video/mp4' });

        } catch (error) {
            console.error("Error adding multiple audio tracks to video:", error);
            throw new Error(`Failed to add multiple audio tracks: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Helper method to test if multiple audio processing works correctly
     */
    async testMultipleAudioProcessing(
        videoFile: File | string | Blob,
        audioFiles: (File | Blob)[]
    ): Promise<Blob> {
        console.log(`🧪 Testing multiple audio processing with ${audioFiles.length} files`);
        
        // Simple test: just mix all audio with equal volume and no timing
        const audioTracks = audioFiles.map((file, i) => ({
            audioFile: file,
            startTime: i * 2, // Stagger by 2 seconds each
            duration: undefined, // Use full duration
            volume: 0.5
        }));
        
        return this.addMultipleAudioToVideo(videoFile, audioTracks);
    }

}
export const ffmpegService = FFmpegService.getInstance();