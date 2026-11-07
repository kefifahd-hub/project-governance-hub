import React, { useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Briefcase, Wrench, Plus, X, ChevronRight } from 'lucide-react';
import { createPageUrl } from '../utils';

// iOS-style grouped list: dark panel holding separate rounded row buttons.
const groupStyle = {
  background: 'rgba(22, 33, 62, 0.85)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
  padding: 8,
};

const rowStyle = {
  width: '100%',
  textAlign: 'left',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '13px 14px',
  borderRadius: 10,
  background: '#16181d',
  border: '1px solid rgba(255,255,255,0.1)',
  minHeight: 48,
  marginBottom: 6,
  cursor: 'pointer',
  WebkitTapHighlightColor: 'transparent',
};

/**
 * Mobile bottom-sheet navigation for Projects and Tools.
 * Replaces the desktop DropdownMenu components on small screens.
 */
export default function MobileNavMenu({ projects, currentProject, projectId, tools }) {
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState('projects');

  const handleProjectClick = (id) => {
    window.location.href = createPageUrl(`Home?id=${id}`);
    setOpen(false);
  };

  const handleToolClick = (page) => {
    window.location.href = createPageUrl(`${page}?id=${projectId}`);
    setOpen(false);
  };

  const handleNewProject = () => {
    window.location.href = createPageUrl('NewProject');
    setOpen(false);
  };

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => { setSection('projects'); setOpen(true); }} style={{ color: '#CADCFC' }}>
        <Briefcase className="w-4 h-4 mr-2" />
        <span className="hidden sm:inline">{currentProject?.projectName || 'Projects'}</span>
        <span className="sm:hidden">Projects</span>
      </Button>
      {projectId && (
        <Button variant="ghost" size="sm" onClick={() => { setSection('tools'); setOpen(true); }} style={{ color: '#CADCFC' }}>
          <Wrench className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Tools</span>
        </Button>
      )}
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent style={{ background: 'rgba(15, 23, 42, 0.98)', maxHeight: '80vh' }}>
          <DrawerHeader className="flex flex-row items-center justify-between">
            <DrawerTitle style={{ color: '#CADCFC' }}>
              {section === 'projects' ? 'Projects' : 'Tools'}
            </DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" style={{ color: '#94A3B8' }}>
                <X className="w-4 h-4" />
              </Button>
            </DrawerClose>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 pb-6 max-h-[60vh]">
            {section === 'projects' && (
              <div style={groupStyle}>
                {projects.map((project) => {
                  const active = projectId === project.id;
                  return (
                    <button
                      key={project.id}
                      onClick={() => handleProjectClick(project.id)}
                      style={{
                        ...rowStyle,
                        color: active ? '#34d399' : '#e2e8f0',
                        background: active ? 'rgba(16,185,129,0.12)' : rowStyle.background,
                        borderColor: active ? 'rgba(16,185,129,0.35)' : rowStyle.borderColor,
                      }}
                    >
                      <Briefcase className="w-4 h-4 shrink-0" style={{ opacity: 0.7 }} />
                      <span className="truncate flex-1">{project.projectName}</span>
                      {active && <span style={{ fontSize: 11, fontWeight: 600 }}>Current</span>}
                    </button>
                  );
                })}
                <button
                  onClick={handleNewProject}
                  style={{ ...rowStyle, color: '#34d399', marginBottom: 0 }}
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  <span className="flex-1">New Project</span>
                </button>
              </div>
            )}
            {section === 'tools' && (
              <div style={groupStyle}>
                {tools.map((tool, i) => (
                  <button
                    key={tool.page}
                    onClick={() => handleToolClick(tool.page)}
                    style={{
                      ...rowStyle,
                      color: '#e2e8f0',
                      marginBottom: i === tools.length - 1 ? 0 : 6,
                    }}
                  >
                    <span className="flex-1 truncate">{tool.name}</span>
                    <ChevronRight className="w-4 h-4 shrink-0" style={{ color: '#475569' }} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}