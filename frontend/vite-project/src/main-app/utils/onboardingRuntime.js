export const isResolvedStepState = (state) => {
  const normalized = String(state || '').toLowerCase();
  return normalized !== 'pending' && normalized !== 'active' && normalized !== 'current';
};

export const resolveChatTipVariant = ({
  commitmentGateEnabled,
  hasTipGigId,
  accessResult,
}) => {
  if (!commitmentGateEnabled) {
    return 'gate_disabled';
  }

  if (!hasTipGigId) {
    return 'access_required';
  }

  const hasAccess = !!(
    accessResult?.success &&
    accessResult?.data &&
    (accessResult.data.hasAccess || accessResult.data.commitmentNotRequired) &&
    !accessResult.data.isAppliedToOrder
  );

  return hasAccess ? 'access_granted' : 'access_required';
};
