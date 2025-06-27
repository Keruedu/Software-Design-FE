export interface AudioTrackData {
  id: string;
  name: string;
  originFile:File|Blob|string;
  file: File|Blob|string;
  duration: number;
  startTime: number;
  volume: number;
  trimStart: number;
  trimEnd: number;
}