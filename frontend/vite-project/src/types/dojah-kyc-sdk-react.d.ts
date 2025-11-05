declare module 'dojah-kyc-sdk-react' {
  import { ComponentType } from 'react';

  export interface DojahConfig {
    widget_id: string;
    debug?: boolean;
    pages?: Array<{
      page: string;
      config: object;
    }>;
  }

  export interface DojahUserData {
    first_name?: string;
    last_name?: string;
    dob?: string;
    email?: string;
    residence_country?: string;
  }

  export interface DojahMetadata {
    user_id?: string;
    user_type?: string;
    platform?: string;
    timestamp?: string;
    [key: string]: any;
  }

  export interface DojahGovData {
    bvn?: string;
    nin?: string;
    dl?: string;
    mobile?: string;
  }

  export interface DojahProps {
    response: (type: 'loading' | 'begin' | 'success' | 'error' | 'close', data: any) => void;
    appID: string;
    publicKey: string;
    type?: string;
    config?: DojahConfig;
    userData?: DojahUserData;
    metadata?: DojahMetadata;
    govData?: DojahGovData;
    referenceId?: string;
  }

  const Dojah: ComponentType<DojahProps>;
  export default Dojah;
}