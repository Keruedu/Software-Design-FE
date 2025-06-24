import React, { createContext, useContext, useState } from "react";

import { AudioTrackData } from '@/types/audio'

//  AudioTrackData
type AudioContextType = {
  audioTracks: AudioTrackData[];
  setAudioTracks: React.Dispatch<React.SetStateAction<AudioTrackData[]>>;
};


const AudioTracksContext = createContext<AudioContextType | undefined>(undefined);
export const useAudioTracksContext = () => {
  const context = useContext(AudioTracksContext);
  if (!context) {
    throw new Error("useAudioContext must be used within AudioContextProvider");
  }
  return context;
};
export const AudioTracksContextProvider = ({
  children,
  value
}: {
  children: React.ReactNode;
  value: AudioContextType;
}) => {
  return (
    <AudioTracksContext.Provider value={value}>
      {children}
    </AudioTracksContext.Provider>
  );
};

//Trim


type TrimVideoContextType = {
  trimStart: number;
  trimEnd: number;
  setTrimStart: React.Dispatch<React.SetStateAction<number>>;
  setTrimEnd: React.Dispatch<React.SetStateAction<number>>;
};


const TrimVideoContext = createContext<TrimVideoContextType | undefined>(undefined);

export const useTrimVideoContext = () => {
  const context = useContext(TrimVideoContext);
  if (!context) {
    throw new Error("useTrimVideoContext must be used within TrimVideoContextProvider");
  }
  return context;
};

export const TrimVideoContextProvider = ({ children,value }: { children: React.ReactNode,value:TrimVideoContextType }) => {
  return (
    <TrimVideoContext.Provider value={value}>
      {children}
    </TrimVideoContext.Provider>
  );
};










