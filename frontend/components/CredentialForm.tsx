'use client';

import { useState, useCallback } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { SUI_CONFIG, SUI_ADDRESS_REGEX, type SkillTag } from '@/lib/constants';
import { SkillSelector } from './SkillSelector';
import { SuccessCard } from './SuccessCard';
import { useSuiClient } from '@mysten/dapp-kit';

interface FormState {
  recipientAddress: string;
  volunteerName: string;
  projectOrEvent: string;
  issuerName: string;
  skillsVerified: SkillTag[];
}

interface FormErrors {
  recipientAddress?: string;
  volunteerName?: string;
  projectOrEvent?: string;
  issuerName?: string;
  skillsVerified?: string;
}

const INITIAL_FORM: FormState = {
  recipientAddress: '',
  volunteerName: '',
  projectOrEvent: '',
  issuerName: '',
  skillsVerified: [],
};

export function CredentialForm() {
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction();

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [txError, setTxError] = useState<string | null>(null);
  const [successObjectId, setSuccessObjectId] = useState<string | null>(null);

  const updateField = useCallback(
    (field: keyof Omit<FormState, 'skillsVerified'>, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    },
    [],
  );

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!SUI_ADDRESS_REGEX.test(form.recipientAddress)) {
      newErrors.recipientAddress =
        'Must be a valid Sui address (0x followed by 64 hex characters)';
    }
    if (form.volunteerName.trim().length < 2) {
      newErrors.volunteerName = 'Name must be at least 2 characters';
    }
    if (form.projectOrEvent.trim().length < 3) {
      newErrors.projectOrEvent = 'Project/event name must be at least 3 characters';
    }
    if (form.issuerName.trim().length < 2) {
      newErrors.issuerName = 'Issuer name must be at least 2 characters';
    }
    if (form.skillsVerified.length === 0) {
      newErrors.skillsVerified = 'Select at least one skill';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = useCallback(() => {
    if (!account) return;
    if (!validate()) return;

    setTxError(null);

    const tx = new Transaction();

    tx.moveCall({
      target: `${SUI_CONFIG.packageId}::${SUI_CONFIG.moduleName}::${SUI_CONFIG.functionName}`,
      arguments: [
        tx.pure.string(form.volunteerName.trim()),
        tx.pure.string(form.projectOrEvent.trim()),
        tx.pure(
          'vector<string>',
          form.skillsVerified.map((s) => s),
        ),
        tx.pure.string(form.issuerName.trim()),
        tx.pure.address(form.recipientAddress),
      ],
    });

    signAndExecute(
      { transaction: tx },
      {
        onSuccess: async (result) => {
          // Wait for transaction to be indexed, then query for created objects
          const txResponse = await suiClient.waitForTransaction({
            digest: result.digest,
            options: { showObjectChanges: true },
          });

          const createdObject = txResponse.objectChanges?.find(
            (change) => change.type === 'created',
          );

          if (createdObject && 'objectId' in createdObject) {
            setSuccessObjectId(createdObject.objectId);
          }
        },
        onError: (error) => {
          console.error('Transaction failed:', error);
          setTxError(
            error.message.includes('rejected')
              ? 'Transaction was rejected in wallet.'
              : `Transaction failed: ${error.message}`,
          );
        },
      },
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, form, signAndExecute, suiClient]);

  const handleReset = useCallback(() => {
    setForm(INITIAL_FORM);
    setErrors({});
    setTxError(null);
    setSuccessObjectId(null);
  }, []);

  if (successObjectId) {
    return (
      <SuccessCard
        objectId={successObjectId}
        volunteerName={form.volunteerName}
        onIssueAnother={handleReset}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Recipient Address */}
      <FormField label="Volunteer Wallet Address" required error={errors.recipientAddress}>
        <input
          type="text"
          placeholder="0x..."
          value={form.recipientAddress}
          onChange={(e) => updateField('recipientAddress', e.target.value)}
          className={inputClass(!!errors.recipientAddress)}
        />
      </FormField>

      {/* Volunteer Name */}
      <FormField label="Volunteer Full Name" required error={errors.volunteerName}>
        <input
          type="text"
          placeholder="e.g. Juan dela Cruz"
          value={form.volunteerName}
          onChange={(e) => updateField('volunteerName', e.target.value)}
          className={inputClass(!!errors.volunteerName)}
        />
      </FormField>

      {/* Project or Event */}
      <FormField label="Project or Event" required error={errors.projectOrEvent}>
        <input
          type="text"
          placeholder="e.g. Sui Builders Program Davao 2026"
          value={form.projectOrEvent}
          onChange={(e) => updateField('projectOrEvent', e.target.value)}
          className={inputClass(!!errors.projectOrEvent)}
        />
      </FormField>

      {/* Issuer Name */}
      <FormField label="Issuer / Organization Name" required error={errors.issuerName}>
        <input
          type="text"
          placeholder="e.g. YGG Pilipinas / Metaversity"
          value={form.issuerName}
          onChange={(e) => updateField('issuerName', e.target.value)}
          className={inputClass(!!errors.issuerName)}
        />
      </FormField>

      {/* Skills Selector */}
      <SkillSelector
        selected={form.skillsVerified}
        onChange={(skills) => {
          setForm((prev) => ({ ...prev, skillsVerified: skills }));
          setErrors((prev) => ({ ...prev, skillsVerified: undefined }));
        }}
        error={errors.skillsVerified}
      />

      {/* Transaction Error */}
      {txError ? (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3">
          <p className="text-sm text-red-400">{txError}</p>
        </div>
      ) : null}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={isPending || !account}
        className={`
          w-full py-3 rounded-xl font-semibold text-sm transition-all duration-150
          ${
            isPending || !account
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer'
          }
        `}
      >
        {isPending ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Waiting for wallet confirmation...
          </span>
        ) : (
          'Issue Credential'
        )}
      </button>

      <p className="text-xs text-center text-gray-600">
        The credential will be minted on Sui Testnet and sent to the volunteer&apos;s wallet.
        Gas fees are negligible (&lt;0.001 SUI).
      </p>
    </div>
  );
}

function FormField({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-300">
        {label}
        {required ? <span className="text-red-400 ml-1">*</span> : null}
      </label>
      {children}
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  );
}

function inputClass(hasError: boolean): string {
  return `
    w-full px-4 py-2.5 rounded-lg text-sm text-white placeholder-gray-500
    bg-gray-900 border transition-colors duration-150 outline-none
    focus:ring-2 focus:ring-indigo-500 focus:border-transparent
    ${
      hasError
        ? 'border-red-500/60 bg-red-500/5'
        : 'border-gray-700 hover:border-gray-600'
    }
  `;
}
