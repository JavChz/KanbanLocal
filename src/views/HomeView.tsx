import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useKanbanStore } from '../store/useKanbanStore';
import { Folder, Plus, CheckCircle, Clock, ListTodo, Circle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getColorStyles } from '../utils/colors';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { ColorPicker } from '../components/ui/ColorPicker';
import { Button } from '../components/ui/Button';

const getRandomProjectColor = () => {
  const hues = ['slate', 'red', 'orange', 'amber', 'emerald', 'blue', 'indigo', 'violet'];
  const shades = ['400', '500', '600', '700', '800'];
  const randomHue = hues[Math.floor(Math.random() * hues.length)];
  const randomShade = shades[Math.floor(Math.random() * shades.length)];
  return `${randomHue}-${randomShade}`;
};

export const HomeView: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { projects, tasks, addProject } = useKanbanStore();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectColor, setNewProjectColor] = useState(getRandomProjectColor);

  const location = useLocation();

  // Trigger project creation modal if action=new-project query parameter is found
  React.useEffect(() => {
    if (location.search.includes('action=new-project')) {
      setIsCreateOpen(true);
      navigate('/', { replace: true });
    }
  }, [location.search, navigate]);

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    const newId = addProject(newProjectName.trim(), newProjectColor);
    setNewProjectName('');
    setNewProjectColor(getRandomProjectColor());
    setIsCreateOpen(false);
    navigate(`/project/${newId}`);
  };

  // Stats Calculations
  const totalProjects = projects.length;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'DONE').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="flex flex-col gap-8 h-full animate-fade-in">
      
      {/* Dashboard Welcome Header */}
      <div className="flex flex-col gap-2 text-left">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-50 md:text-4xl">
          {t('home')}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
          {t('home_desc')}
        </p>
      </div>

      {/* Premium Statistics Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Stat item 1 */}
        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 text-left">
          <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
            <Folder size={20} />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium uppercase tracking-wider">
              {t('projects')}
            </span>
            <span className="text-xl font-bold font-mono text-slate-800 dark:text-slate-100">
              {totalProjects}
            </span>
          </div>
        </div>

        {/* Stat item 2 */}
        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 text-left">
          <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
            <Clock size={20} />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium uppercase tracking-wider">
              {t('in_progress')}
            </span>
            <span className="text-xl font-bold font-mono text-slate-800 dark:text-slate-100">
              {inProgressTasks}
            </span>
          </div>
        </div>

        {/* Stat item 3 */}
        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 text-left">
          <div className="p-3 rounded-xl bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400">
            <CheckCircle size={20} />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium uppercase tracking-wider">
              {t('done')}
            </span>
            <span className="text-xl font-bold font-mono text-slate-800 dark:text-slate-100">
              {completedTasks} / {totalTasks}
            </span>
          </div>
        </div>

        {/* Stat item 4: Completion Rate Gauge */}
        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 text-left">
          <div className="p-3 rounded-xl bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
            <ListTodo size={20} />
          </div>
          <div className="flex-1">
            <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium uppercase tracking-wider">
              {t('progress')}
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xl font-bold font-mono text-slate-800 dark:text-slate-100">
                {completionRate}%
              </span>
              <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Projects Section */}
      <div className="flex flex-col gap-4 text-left">
        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">
          {t('your_boards')}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Create Project Card */}
          <button
            onClick={() => setIsCreateOpen(true)}
            className="h-44 border-2 border-dashed border-slate-300 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-400 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-200 hover:bg-slate-200/20 dark:hover:bg-slate-900/10 group active:scale-98"
          >
            <div className="p-3 rounded-full bg-slate-200 dark:bg-slate-900 text-slate-500 dark:text-slate-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 group-hover:bg-blue-500/10 transition-colors">
              <Plus size={22} />
            </div>
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
              {t('add_project')}
            </span>
          </button>

          {/* Render Active Projects */}
          {projects.map((proj) => {
            const colorStyles = getColorStyles(proj.color);
            const projTasks = tasks.filter((t) => t.projectId === proj.id);
            const doneCount = projTasks.filter((t) => t.status === 'DONE').length;
            const openCount = projTasks.length - doneCount;

            return (
              <div
                key={proj.id}
                onClick={() => navigate(`/project/${proj.id}`)}
                className={`h-44 glass-card p-5 rounded-2xl cursor-pointer flex flex-col justify-between text-left border-l-4 ${colorStyles.border}`}
              >
                <div>
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <Circle size={8} className={`fill-current ${colorStyles.text}`} />
                    <h4 className="font-bold text-base text-slate-800 dark:text-slate-100 truncate">
                      {proj.name}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium font-mono">
                    ID: {proj.id.substring(0, 8)}...
                  </p>
                </div>

                <div className="flex gap-4 items-center border-t border-slate-200/50 dark:border-slate-800/30 pt-3">
                  <div className="flex items-center gap-1.5">
                    <Clock size={14} className="text-slate-500 dark:text-slate-400" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-350">
                      {openCount} {t('active')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle size={14} className="text-green-600 dark:text-green-500" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-350">
                      {doneCount} {t('completed')}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create Project Dialog */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title={t('add_project')}
        overflowVisible={true}
      >
        <form onSubmit={handleCreateProject} className="flex flex-col gap-5 text-left">
          <div className="flex items-end gap-2.5">
            <div className="flex-1">
              <Input
                label={t('project_name')}
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="e.g., Personal Errands"
                required
                autoFocus
              />
            </div>
            <ColorPicker
              value={newProjectColor}
              onChange={setNewProjectColor}
            />
          </div>

          <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-slate-200/50 dark:border-slate-800/30">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsCreateOpen(false)}
            >
              {t('cancel')}
            </Button>
            <Button type="submit" variant="primary">
              {t('create')}
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
