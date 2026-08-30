const express = require('express');
const router = express.Router();
const { readJSON } = require('../services/data.service');
const Groq = require('groq-sdk');
const Anthropic = require('@anthropic-ai/sdk');

// POST /api/copilot/:projectId/checklist — generate inspection checklist
router.post('/:projectId/checklist', async (req, res) => {
  const DATA_DIR = req.app.locals.DATA_DIR;
  const projectId = req.params.projectId;
  const riskReport = readJSON(DATA_DIR, `verified/${projectId}_report.json`);
  const project = (readJSON(DATA_DIR, 'projects.json') || []).find(
    (p) => p.project_id === projectId
  );
  const extracted = readJSON(DATA_DIR, `extracted/${projectId}.json`);

  if (!riskReport || !project) {
    return res
      .status(404)
      .json({ error: 'Project data not found. Run the processing pipeline first.' });
  }

  const flags = riskReport.flags || [];
  const redFlags = flags.filter((f) => f.severity === 'red');
  const yellowFlags = flags.filter((f) => f.severity === 'yellow');

  let sampling_strategy, sampling_explanation;
  if (riskReport.overall_score >= 71) {
    sampling_strategy = 'full_reinspection';
    sampling_explanation =
      'Critical risk score — full physical re-inspection recommended across all flagged areas.';
  } else if (riskReport.overall_score >= 46) {
    sampling_strategy = 'sample_check';
    sampling_explanation = `High risk — spot-check ${Math.min(50, redFlags.length * 20 + yellowFlags.length * 10)}% of flagged segments.`;
  } else {
    sampling_strategy = 'dashboard_monitoring';
    sampling_explanation =
      'Low-to-medium risk — continue dashboard monitoring with periodic review.';
  }

  const prompt = `You are the lead AI Infrastructure Auditor for INFRA-XRAY.
Analyze the following infrastructure project audit data and generate a structured field inspection action plan for human auditors.

Project Information:
- ID: ${project.project_id}
- Name: ${project.project_name}
- State: ${project.state}
- Category: ${project.category}
- Sanctioned: ${project.sanctioned_amount_inr} INR, ${project.sanctioned_quantity} ${project.unit}
- Contractor: ${project.contractor_name}
- Start Date: ${project.start_date}, Deadline: ${project.deadline}

Extracted Metrics:
${JSON.stringify(extracted || {}, null, 2)}

Detected Flags & Risk Score (${riskReport.overall_score}/100, Severity: ${riskReport.severity_label}):
${JSON.stringify(flags, null, 2)}

Respond with strict JSON adhering to this schema:
{
  "sampling_strategy": "full_reinspection" | "sample_check" | "dashboard_monitoring",
  "sampling_explanation": "string explaining reasoning for strategy",
  "contractor_inquiries": ["Specific questions to ask contractor/engineers with evidence citations"],
  "gps_focus_areas": ["Key GPS points or chainages requiring physical ground survey"],
  "checklist": [
    {
      "item": "Specific action item for field inspector",
      "priority": "high" | "medium" | "low",
      "reference": "Document/Photo citation",
      "verification_method": "e.g., Total Station survey, Core drill, GPS cross-check"
    }
  ]
}`;

  // 1. If GROQ_API_KEY is available, use ultra-fast Groq LLM (llama-3.3-70b-versatile)
  if (process.env.GROQ_API_KEY) {
    try {
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an expert infrastructure auditor. Return valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.2,
        response_format: { type: 'json_object' },
      });

      const text = chatCompletion.choices[0]?.message?.content?.trim();
      const parsed = JSON.parse(text);
      return res.json({
        project_id: projectId,
        llm_generated: true,
        llm_provider: 'Groq (llama-3.3-70b-versatile)',
        sampling_strategy: parsed.sampling_strategy || sampling_strategy,
        sampling_explanation: parsed.sampling_explanation || sampling_explanation,
        contractor_inquiries: parsed.contractor_inquiries || [],
        gps_focus_areas: parsed.gps_focus_areas || [],
        checklist: parsed.checklist || [],
      });
    } catch (groqErr) {
      console.warn('Groq Copilot call failed, trying fallback:', groqErr.message);
    }
  }

  // 2. If ANTHROPIC_API_KEY is available, use Claude
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      });

      const text = response.content[0]?.text?.trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return res.json({
          project_id: projectId,
          llm_generated: true,
          llm_provider: 'Anthropic (Claude 3.5 Sonnet)',
          sampling_strategy: parsed.sampling_strategy || sampling_strategy,
          sampling_explanation: parsed.sampling_explanation || sampling_explanation,
          contractor_inquiries: parsed.contractor_inquiries || [],
          gps_focus_areas: parsed.gps_focus_areas || [],
          checklist: parsed.checklist || [],
        });
      }
    } catch (llmErr) {
      console.warn('Anthropic Copilot call failed, using intelligent fallback:', llmErr.message);
    }
  }

  // Intelligent Contextual Heuristic Checklist
  const contractorInquiries = [];
  const gpsFocusAreas = [];
  const checklist = [];

  flags.forEach((f) => {
    const isRed = f.severity === 'red';
    const ref =
      f.documents_involved?.join(', ') || f.photos_involved?.join(', ') || 'Project Specs';

    if (f.category === 'quantity_mismatch') {
      checklist.push({
        item: `Perform chainage-wise physical measurement of completed road/structure to verify actual quantity against claimed ${extracted?.progress_report?.quantity_completed ?? ''} ${extracted?.progress_report?.unit ?? ''}.`,
        priority: 'high',
        reference: ref,
        verification_method: 'Laser Distance Meter / Total Station Survey',
      });
      contractorInquiries.push(
        `Explain variance between claimed completion (${extracted?.progress_report?.quantity_completed ?? 'N/A'}) and verified physical quantity (${extracted?.inspection_report?.verified_quantity ?? 'N/A'}).`
      );
    } else if (f.category === 'cost_overrun' || f.category === 'unit_rate_inflation') {
      checklist.push({
        item: `Audit measurement book (MB) entries corresponding to Invoice ${extracted?.invoice?.invoice_number || 'latest'} against sanctioned BOQ unit rates.`,
        priority: 'high',
        reference: ref,
        verification_method: 'Financial Measurement Book (MB) Reconciliation',
      });
      contractorInquiries.push(
        `Provide cost justification for billing exceeding sanctioned BOQ rate schedule.`
      );
    } else if (f.category === 'geospatial_deviation' || f.category === 'boundary_breach') {
      checklist.push({
        item: `Take calibrated GPS readings along disputed route coordinates to verify alignment with sanctioned tender corridor.`,
        priority: 'high',
        reference: ref,
        verification_method: 'Differential GPS (DGPS) Boundary Verification',
      });
      gpsFocusAreas.push('Sanctioned Route Coordinates vs Ground Centerline');
    } else if (f.category === 'structural_damage' || f.category === 'surface_defect') {
      checklist.push({
        item: `Conduct visual and non-destructive testing at locations flagged with surface defects/potholes/cracking.`,
        priority: isRed ? 'high' : 'medium',
        reference: ref,
        verification_method: 'Rebound Hammer / Core Sample Analysis',
      });
    } else {
      checklist.push({
        item: `Verify: ${f.message}`,
        priority: isRed ? 'high' : 'medium',
        reference: ref,
        verification_method: 'Cross-document forensic audit',
      });
    }
  });

  if (checklist.length === 0) {
    checklist.push({
      item: 'Routine milestone verification: Confirm work progress meets deadline schedule.',
      priority: 'low',
      reference: 'Contract.pdf',
      verification_method: 'Visual Spot Check',
    });
    checklist.push({
      item: 'Verify contractor quality control register and concrete cube test reports.',
      priority: 'low',
      reference: 'BOQ.pdf',
      verification_method: 'Material Lab Certificate Inspection',
    });
  }

  res.json({
    project_id: projectId,
    llm_generated: false,
    sampling_strategy,
    sampling_explanation,
    contractor_inquiries: contractorInquiries,
    gps_focus_areas: gpsFocusAreas,
    checklist,
  });
});

module.exports = router;
