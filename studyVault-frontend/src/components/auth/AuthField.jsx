import { AppInput } from '@/components/ui/index.js';

const AuthField = ({ label, required = true, ...props }) => {
  return <AppInput label={label} required={required} {...props} />;
};

export default AuthField;
