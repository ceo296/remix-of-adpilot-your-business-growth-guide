export type UserType = 'business' | 'agency' | null;

export type SuccessMetric = 'leads' | 'purchases' | 'whatsapp' | 'calls';

export type Integration = 'whatsapp' | 'email' | 'crm' | 'sheets';

export interface WizardData {
  // Step 1: Identification
  userType: UserType;
  
  // Step 2: Brief
  businessName: string;
  whatYouSell: string;
  targetAudience: string;
  activityArea: string;
  
  // Step 3: Success Metrics
  successMetrics: SuccessMetric[];
  
  // Step 4: Integrations
  integrations: Integration[];
  
  // Step 5: Creative Assets
  hasAssets: boolean;
  createAutomatically: boolean;
  uploadedFiles: File[];
  
  // Step 6: Budget
  monthlyBudget: number;
}

export const initialWizardData: WizardData = {
  userType: null,
  businessName: '',
  whatYouSell: '',
  targetAudience: '',
  activityArea: '',
  successMetrics: [],
  integrations: [],
  hasAssets: true,
  createAutomatically: false,
  uploadedFiles: [],
  monthlyBudget: 3000,
};
