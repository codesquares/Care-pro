import Modal from "../modal/Modal";

const ResumeModal = ({
  isOpen,
  onClose,
  onResume,
  onStartFresh,
  draftInfo
}) => {
  const handleResume = () => {
    onResume();
    onClose();
  };

  const handleStartFresh = () => {
    onStartFresh();
    onClose();
  };

  const formatLastSaved = (date) => {
    if (!date) return 'Unknown';
    return new Date(date).toLocaleString();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Resume Your Work"
      description={`We found an auto-saved draft from ${formatLastSaved(draftInfo?.lastSaved)}. Would you like to resume where you left off or start fresh?`}
      buttonText="Resume Draft"
      buttonBgColor="#00B4A6"
      secondaryButtonText="Start Fresh"
      onSecondaryAction={handleStartFresh}
      onProceed={handleResume}
    />
  );
};

export default ResumeModal;