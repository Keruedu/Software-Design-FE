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
                if(false)
                {
                    filterComplex =`[1:a]volume=${audioVolume},aformat=sample_fmts=fltp:sample_rates=44100${audioDelay}[audio_processed]`;
                }
                else{
                    filterComplex = `
                        [0:a]aformat=sample_fmts=fltp:sample_rates=44100[a_orig];
                        [1:a]volume=${audioVolume},aformat=sample_fmts=fltp:sample_rates=44100${audioDelay}[a_new];
                        [a_orig][a_new]amix=inputs=2:duration=first[audio_processed]
                    `.replace(/\s+/g, " "); // xoá linebreak cho ffmpeg wasm
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
        videoFile:File|string|Blob,
        startTime:number,
        endTime:number
    ): Promise<Blob> {
        if(!this.ffmpeg||!this.isLoaded)
        {
            throw new Error("FFmpeg is not initialized. Call initialize() first.");
        }
        try{
            let videoData:ArrayBuffer;
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
            const timestamp = Date.now();
            const inputVideoName = `input_video_${timestamp}.mp4`;
            const outputName = `output_${timestamp}.mp4`;
            await this.ffmpeg.writeFile(inputVideoName, new Uint8Array(videoData));
            await this.ffmpeg.exec([
                '-i', inputVideoName,
                '-ss', startTime.toString(),
                '-to', endTime.toString(),
                '-c', 'copy',
                outputName
            ])
            const data = await this.ffmpeg.readFile(outputName);
            await this.ffmpeg.deleteFile(inputVideoName);
            await this.ffmpeg.deleteFile(outputName);
            return new Blob([data], { type: 'video/mp4' });
        }
        catch (error) {
            console.error("Error adding audio to video:", error);
            throw new Error(`Failed to add audio to video: ${error instanceof Error ? error.message : String(error)}`);
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


    
}
export const ffmpegService = FFmpegService.getInstance();