import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MpToolbar } from './toolbar';

@Component({
  template: `
    <mp-toolbar id="test-toolbar">
      <ng-template #start><span id="start-content">Start</span></ng-template>
      <ng-template #center><span id="center-content">Center</span></ng-template>
      <ng-template #end><span id="end-content">End</span></ng-template>
    </mp-toolbar>
  `,
  imports: [MpToolbar],
})
class TestHostWithAllSlots {}

@Component({
  template: `
    <mp-toolbar id="test-toolbar-no-center">
      <ng-template #start><span id="start-only">Start</span></ng-template>
      <ng-template #end><span id="end-only">End</span></ng-template>
    </mp-toolbar>
  `,
  imports: [MpToolbar],
})
class TestHostWithoutCenter {}

@Component({
  template: ` <mp-toolbar id="test-toolbar-empty" /> `,
  imports: [MpToolbar],
})
class TestHostEmpty {}

describe('MpToolbar', () => {
  describe('with all slots', () => {
    let fixture: ComponentFixture<TestHostWithAllSlots>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [TestHostWithAllSlots],
      }).compileComponents();

      fixture = TestBed.createComponent(TestHostWithAllSlots);
      fixture.detectChanges();
    });

    it('should render toolbar with correct id and role', () => {
      const toolbar = fixture.nativeElement.querySelector('#test-toolbar') as HTMLElement;
      expect(toolbar).toBeTruthy();
      expect(toolbar.getAttribute('role')).toBe('toolbar');
    });

    it('should render start slot content', () => {
      const startContent = fixture.nativeElement.querySelector('#start-content') as HTMLElement;
      expect(startContent).toBeTruthy();
      expect(startContent.textContent).toBe('Start');
    });

    it('should render center slot content', () => {
      const centerContent = fixture.nativeElement.querySelector('#center-content') as HTMLElement;
      expect(centerContent).toBeTruthy();
      expect(centerContent.textContent).toBe('Center');
    });

    it('should render end slot content', () => {
      const endContent = fixture.nativeElement.querySelector('#end-content') as HTMLElement;
      expect(endContent).toBeTruthy();
      expect(endContent.textContent).toBe('End');
    });
  });

  describe('without center slot', () => {
    let fixture: ComponentFixture<TestHostWithoutCenter>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [TestHostWithoutCenter],
      }).compileComponents();

      fixture = TestBed.createComponent(TestHostWithoutCenter);
      fixture.detectChanges();
    });

    it('should render toolbar with correct id', () => {
      const toolbar = fixture.nativeElement.querySelector(
        '#test-toolbar-no-center',
      ) as HTMLElement;
      expect(toolbar).toBeTruthy();
    });

    it('should render start and end content without center', () => {
      expect(fixture.nativeElement.querySelector('#start-only')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('#end-only')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('#center-content')).toBeFalsy();
    });
  });

  describe('without id', () => {
    let fixture: ComponentFixture<TestHostEmpty>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [TestHostEmpty],
      }).compileComponents();

      fixture = TestBed.createComponent(TestHostEmpty);
      fixture.detectChanges();
    });

    it('should render empty toolbar with id attribute', () => {
      const toolbar = fixture.nativeElement.querySelector('#test-toolbar-empty') as HTMLElement;
      expect(toolbar).toBeTruthy();
      expect(toolbar.getAttribute('role')).toBe('toolbar');
    });
  });
});
