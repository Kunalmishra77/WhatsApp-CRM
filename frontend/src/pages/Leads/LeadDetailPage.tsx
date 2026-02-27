import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import Placeholder from '../Placeholder';

const LeadDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl">
          <ChevronLeft size={20} />
        </Button>
        <h2 className="text-3xl font-black tracking-tighter uppercase italic text-zinc-900 dark:text-zinc-100">
          Lead <span className="font-light text-zinc-500">Detail</span>
        </h2>
        <Badge variant="teal" className="ml-2">ID: {id}</Badge>
      </div>
      <Placeholder name={`Lead Profile: ${id}`} />
    </div>
  );
};

export default LeadDetailPage;
