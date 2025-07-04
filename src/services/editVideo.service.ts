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
            console.log("Duraaaaaaa",params.timing.duration)
            const { textFilter, font } = this.buildTextFilter(params, videoSize);
            if (font) fontsUsed.add(font); 
            return textFilter;
            });
            const textFilters = filterResults.join(',');
            console.log("Text filters:", textFilters);
            console.log("Fonts used:", Array.from(fontsUsed));
            await Promise.all(Array.from(fontsUsed).map(async (font) => {
                if (!this.ffmpeg) return;
                const fontResponse = await fetch(`/fonts/${font}`);
                const fontBuffer = await fontResponse.arrayBuffer();
                await this.ffmpeg.writeFile(`${font}`, new Uint8Array(fontBuffer));
            }));

            const ffmpegCommand = [
            "-i", inputVideoName,
            "-vf", textFilters,
            "-c:a", "copy",
            outputName
            ];
            console.log("FFmpeg command:", ffmpegCommand.join(" "));
            await this.ffmpeg.exec(ffmpegCommand);
            const data = await this.ffmpeg.readFile(outputName);
            const resultBlob = new Blob([data], { type: 'video/mp4' });
            await this.ffmpeg.deleteFile(inputVideoName);
            await this.ffmpeg.deleteFile(outputName);
            await Promise.all(Array.from(fontsUsed).map(async (font) => {
                if (!this.ffmpeg) return;
                await this.ffmpeg.deleteFile(font);
            }));

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
        let font='';
        const escapedText = text.replace(/'/g, "\\'").replace(/:/g, "\\:");
        console.log("Debugg timing", timing)
        const x = Math.round((position.x / 100) * videoSize.width);
        const y = Math.round((position.y / 100) * videoSize.height);
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
        }

        if (timing.startTime > 0) {
            textFilter += `:enable='between(t,${timing.startTime},${timing.startTime + timing.duration})'`;
        } else {
            textFilter += `:enable='between(t,0,${timing.duration})'`;
        }
        return { textFilter, font };
    }

    private mapFontFamily(fontFamily: string): string | null {
        const fontMap: { [key: string]: string } = {
            'Roboto':'Roboto',
            'Open Sans':'OpenSans',
            'Lato':'Lato',
        };
        
        return fontMap[fontFamily] || null;
    }
}
export const ffmpegService = FFmpegService.getInstance();