declare module 'lamejs' {
  class Mp3Encoder {
    constructor(channels: number, sampleRate: number, kbps: number);
    encodeBuffer(buffer: Int16Array): Uint8Array;
    flush(): Uint8Array;
  }

  const MPEGMode: {
    STEREO: number;
    JOINT_STEREO: number;
    DUAL_CHANNEL: number;
    MONO: number;
  };

  const Lame: {
    Mp3Encoder: typeof Mp3Encoder;
  };

  export { Mp3Encoder, MPEGMode };
  export default Lame;
} 