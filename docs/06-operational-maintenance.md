# Operational & Maintenance Checklist

## Overview

This guide provides ongoing operational procedures, maintenance tasks, and monitoring requirements to keep SRTrack running smoothly in production.

**Frequency**: Regular maintenance prevents issues and ensures system reliability.

---

## Daily Operations

### Morning Checklist (Commander/Admin)

**Time**: Before 08:00 SGT

**Tasks**:
- [ ] Check dashboard for overnight activity
- [ ] Review any overdue users from previous day
- [ ] Verify bot is responding to messages
- [ ] Check for system alerts/notifications
- [ ] Review error logs (if accessible)

**Actions**:
- Contact overdue trainees if needed
- Investigate any system errors
- Document any issues

---

### Daily Cutoff Check (Automated)

**Time**: 22:05 SGT (5 minutes after cutoff)

**Automated Process**:
1. Query all active clock-ins from today
2. Mark overdue records (`is_overdue = true`)
3. Send notifications to commanders
4. Log action in audit log

**Manual Verification** (if automated system fails):
- [ ] Run overdue check query manually
- [ ] Verify overdue users marked correctly
- [ ] Send notifications if needed
- [ ] Document any issues

**Query for Manual Check**:
```sql
SELECT 
  t.rank,
  t.full_name,
  t.identification_number,
  t.company,
  al.clock_in_time
FROM attendance_logs al
JOIN trainees t ON al.trainee_id = t.id
WHERE al.status = 'IN'
  AND al.date = CURRENT_DATE
  AND al.clock_out_time IS NULL
  AND EXTRACT(HOUR FROM (NOW() AT TIME ZONE 'Asia/Singapore')) >= 22;
```

---

## Weekly Maintenance

### Week 1: System Health Review

**Day**: Monday morning

**Tasks**:
- [ ] Review error logs from past week
- [ ] Check application uptime statistics
- [ ] Review database performance metrics
- [ ] Check disk space usage (Supabase)
- [ ] Review user activity patterns
- [ ] Verify backup completion

**Metrics to Review**:
- Error rate (should be < 1%)
- Average response time
- Database query performance
- Bot response time
- Notification delivery rate

---

### Week 2: Security Review

**Day**: Monday morning

**Tasks**:
- [ ] Review authentication logs
- [ ] Check for failed login attempts
- [ ] Verify RLS policies still active
- [ ] Review access logs (if available)
- [ ] Check for unusual activity patterns
- [ ] Verify environment variables secure

**Security Checks**:
- No exposed secrets in logs
- No unauthorized access attempts
- RLS policies functioning
- HTTPS certificates valid
- Bot token not compromised

---

### Week 3: Database Maintenance

**Day**: Monday morning

**Tasks**:
- [ ] Review database size growth
- [ ] Check index usage statistics
- [ ] Identify slow queries
- [ ] Review table statistics
- [ ] Check for orphaned records
- [ ] Verify constraints working

**Database Queries**:
```sql
-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;
```

---

### Week 4: User Management

**Day**: Monday morning

**Tasks**:
- [ ] Review new registrations
- [ ] Verify trainee data accuracy
- [ ] Check for duplicate registrations
- [ ] Review commander/admin accounts
- [ ] Deactivate inactive accounts (if policy)
- [ ] Update user documentation

**Queries**:
```sql
-- Check for duplicate telegram_user_ids
SELECT telegram_user_id, COUNT(*)
FROM trainees
GROUP BY telegram_user_id
HAVING COUNT(*) > 1;

-- Check for duplicate identification_numbers
SELECT identification_number, COUNT(*)
FROM trainees
GROUP BY identification_number
HAVING COUNT(*) > 1;
```

---

## Monthly Maintenance

### Month 1: Comprehensive System Review

**Date**: First Monday of month

**Tasks**:
- [ ] Full system health audit
- [ ] Review all error logs
- [ ] Analyze performance trends
- [ ] Review security incidents
- [ ] Update documentation
- [ ] Review and update backup procedures

**Reports to Generate**:
- Monthly attendance summary
- System uptime report
- Error summary
- User activity report

---

### Month 2: Backup and Recovery Testing

**Date**: First Monday of month

**Tasks**:
- [ ] Verify backups are running
- [ ] Test database restore procedure
- [ ] Document recovery time
- [ ] Update disaster recovery plan
- [ ] Test rollback procedures

**Backup Verification**:
1. Check Supabase backup status
2. Verify backup retention period
3. Test restore in staging environment
4. Document restore time
5. Update recovery procedures if needed

---

### Month 3: Performance Optimization

**Date**: First Monday of month

**Tasks**:
- [ ] Analyze slow queries
- [ ] Review database indexes
- [ ] Optimize API routes
- [ ] Review caching strategy
- [ ] Update indexes if needed
- [ ] Document performance improvements

**Performance Metrics**:
- Average API response time
- Database query execution time
- Page load times
- Bot response time

---

### Month 4: Security Audit

**Date**: First Monday of month

**Tasks**:
- [ ] Review all security policies
- [ ] Check for security updates
- [ ] Review access logs
- [ ] Verify RLS policies
- [ ] Test authentication flows
- [ ] Review password policies
- [ ] Check for exposed secrets

**Security Checklist**:
- [ ] All dependencies up to date
- [ ] No known vulnerabilities
- [ ] RLS policies correct
- [ ] Authentication working
- [ ] No exposed secrets
- [ ] HTTPS everywhere
- [ ] Rate limiting active

---

## Quarterly Maintenance

### Q1: Infrastructure Review

**Tasks**:
- [ ] Review hosting costs
- [ ] Evaluate hosting performance
- [ ] Consider scaling options
- [ ] Review monitoring tools
- [ ] Update infrastructure documentation

---

### Q2: Feature Review

**Tasks**:
- [ ] Review user feedback
- [ ] Identify feature requests
- [ ] Plan improvements
- [ ] Update roadmap
- [ ] Document changes

---

### Q3: Compliance Review

**Tasks**:
- [ ] Review data retention policies
- [ ] Verify privacy compliance
- [ ] Review audit logs
- [ ] Update compliance documentation
- [ ] Review access controls

---

### Q4: Annual Planning

**Tasks**:
- [ ] Review annual metrics
- [ ] Plan for next year
- [ ] Budget review
- [ ] Technology stack evaluation
- [ ] Team training needs

---

## Monitoring and Alerts

### Application Monitoring

**Metrics to Monitor**:
- **Uptime**: Should be > 99.9%
- **Response Time**: < 500ms average
- **Error Rate**: < 1%
- **Database Connections**: Within limits
- **Memory Usage**: < 80%
- **CPU Usage**: < 70%

**Tools**:
- Vercel Analytics (web app)
- Railway/Render Metrics (bot)
- Supabase Dashboard (database)
- UptimeRobot (external monitoring)

---

### Error Monitoring

**Error Types to Track**:
- Authentication failures
- Database connection errors
- API errors
- Bot webhook errors
- Validation errors

**Alert Thresholds**:
- **Critical**: > 10 errors/minute
- **Warning**: > 5 errors/minute
- **Info**: Any error logged

**Tools**:
- Sentry (recommended)
- Application logs
- Supabase logs

---

### Database Monitoring

**Metrics to Monitor**:
- **Connection Pool**: Usage percentage
- **Query Performance**: Slow queries
- **Database Size**: Growth rate
- **Backup Status**: Success/failure
- **Replication Lag**: If using replication

**Supabase Dashboard**:
- Go to Database → Performance
- Review slow queries
- Check connection pool usage
- Monitor database size

---

## Common Issues and Resolutions

### Issue: Bot Not Responding

**Symptoms**:
- Bot doesn't respond to messages
- Webhook errors in logs

**Diagnosis**:
1. Check bot hosting status (Railway/Render/Fly.io)
2. Verify webhook is set correctly
3. Check bot token validity
4. Review application logs

**Resolution**:
1. Restart bot service
2. Reconfigure webhook if needed
3. Verify environment variables
4. Check Telegram API status

---

### Issue: Dashboard Not Loading Data

**Symptoms**:
- Dashboard shows empty
- Error messages in browser console
- API errors

**Diagnosis**:
1. Check Vercel deployment status
2. Verify Supabase connection
3. Check RLS policies
4. Review API route logs

**Resolution**:
1. Verify environment variables
2. Check Supabase connection
3. Review RLS policies
4. Check API route implementation

---

### Issue: Overdue Users Not Marked

**Symptoms**:
- Users not marked overdue after cutoff
- Notifications not sent

**Diagnosis**:
1. Check scheduled job status
2. Verify timezone handling
3. Review database queries
4. Check notification logs

**Resolution**:
1. Run overdue check manually
2. Verify timezone configuration
3. Check notification system
4. Review scheduled job logs

---

### Issue: Duplicate Clock-Ins

**Symptoms**:
- Trainee can clock in twice
- Database constraint violations

**Diagnosis**:
1. Check database constraints
2. Review application logic
3. Check for race conditions
4. Review logs

**Resolution**:
1. Verify unique constraint exists
2. Review clock-in validation logic
3. Add database-level constraint if missing
4. Implement transaction locking if needed

---

### Issue: Authentication Failures

**Symptoms**:
- Users cannot log in
- Session errors
- Redirect loops

**Diagnosis**:
1. Check Supabase Auth status
2. Verify session configuration
3. Review middleware logic
4. Check cookie settings

**Resolution**:
1. Verify Supabase connection
2. Check session configuration
3. Review middleware
4. Clear browser cookies/cache

---

## Backup Procedures

### Database Backups

**Automatic Backups** (Supabase):
- Daily backups (retained for 7 days)
- Weekly backups (retained for 4 weeks)
- Monthly backups (retained for 12 months)

**Manual Backup** (if needed):
```bash
# Using Supabase CLI
supabase db dump -f backup.sql

# Or using pg_dump
pg_dump -h your-db-host -U postgres -d postgres > backup.sql
```

**Backup Verification**:
- [ ] Backups running automatically
- [ ] Backup retention period correct
- [ ] Can restore from backup
- [ ] Backup size reasonable

---

### Code Backups

**Version Control**:
- All code in GitHub
- Regular commits
- Tagged releases
- Branch protection enabled

**Backup Checklist**:
- [ ] Code in version control
- [ ] Environment variables documented (securely)
- [ ] Database schema versioned
- [ ] Deployment scripts versioned

---

## Disaster Recovery

### Recovery Procedures

**Scenario 1: Database Corruption**

**Steps**:
1. Stop all applications
2. Restore from latest backup
3. Verify data integrity
4. Restart applications
5. Monitor for issues

**Recovery Time Objective (RTO)**: 2 hours
**Recovery Point Objective (RPO)**: 24 hours (daily backup)

---

**Scenario 2: Application Failure**

**Steps**:
1. Identify failed component
2. Check deployment logs
3. Rollback to previous version
4. Investigate root cause
5. Fix and redeploy

**RTO**: 30 minutes
**RPO**: Minimal (no data loss)

---

**Scenario 3: Bot Token Compromise**

**Steps**:
1. Revoke compromised token (BotFather)
2. Generate new token
3. Update environment variables
4. Redeploy bot
5. Update webhook
6. Monitor for unauthorized access

**RTO**: 15 minutes
**RPO**: None (no data loss)

---

## Performance Optimization

### Database Optimization

**Regular Tasks**:
- [ ] Review slow queries monthly
- [ ] Add indexes for frequent queries
- [ ] Remove unused indexes
- [ ] Update table statistics
- [ ] Vacuum database (if needed)

**Query Optimization**:
```sql
-- Analyze table statistics
ANALYZE attendance_logs;
ANALYZE trainees;
ANALYZE commanders;

-- Check for unused indexes
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;
```

---

### Application Optimization

**Regular Tasks**:
- [ ] Review API response times
- [ ] Optimize database queries
- [ ] Implement caching where appropriate
- [ ] Minimize bundle size
- [ ] Optimize images

**Caching Strategy**:
- Cache dashboard data (5 minutes)
- Cache trainee list (10 minutes)
- Invalidate on updates

---

## User Support

### Common User Issues

**Issue: Cannot Register**

**Resolution**:
1. Verify Telegram User ID not already registered
2. Check identification number uniqueness
3. Verify all required fields provided
4. Check for system errors

---

**Issue: Cannot Clock In**

**Resolution**:
1. Verify user is registered
2. Check if already clocked in
3. Verify current time (not past cutoff)
4. Check for system errors

---

**Issue: Cannot Clock Out**

**Resolution**:
1. Verify user is currently clocked in
2. Check for active log entry
3. Verify system status
4. Check for errors

---

**Issue: Dashboard Access Denied**

**Resolution**:
1. Verify user is logged in
2. Check user role and company
3. Verify RLS policies
4. Check for system errors

---

## Documentation Updates

### When to Update Documentation

**Update Required When**:
- New features added
- Procedures change
- Infrastructure changes
- Security policies updated
- User feedback incorporated

**Documentation to Maintain**:
- Setup guides
- Deployment procedures
- Operational procedures
- User guides
- API documentation
- Database schema

---

## Training and Knowledge Transfer

### Team Training

**Topics to Cover**:
- System architecture
- Daily operations
- Common issues
- Troubleshooting procedures
- Security practices
- Backup and recovery

**Training Schedule**:
- New team members: Within first week
- Existing team: Quarterly refresher
- After major changes: Immediate training

---

## Maintenance Log

### Keep Maintenance Log

**Record**:
- Date and time of maintenance
- Type of maintenance
- Actions taken
- Issues encountered
- Resolution
- Next steps

**Format**:
```
Date: YYYY-MM-DD
Type: [Daily/Weekly/Monthly/Quarterly]
Actions:
- Action 1
- Action 2
Issues:
- Issue 1 (resolved)
Next Steps:
- Follow-up action
```

---

## Next Steps

After establishing operations:

1. **Failure Scenarios** → See `07-failure-scenarios-safeguards.md`
2. **Review Architecture** → See `01-system-architecture-overview.md`

